import { query } from '../db/pool.js';
import { paiseToRupees } from '../utils/money.js';
import { isDateNotFuture, isValidIsoDate } from '../utils/dates.js';
import { createPurchase } from './purchase.service.js';
import { upsertVakro } from './vakro.service.js';
import type {
  DataExportRow,
  DataImportPreview,
  DataImportResult,
  DataImportRow,
  DataImportRowError,
} from '@turnover/shared';

export function validateImportRows(rows: DataImportRow[]): DataImportPreview {
  const errors: DataImportRowError[] = [];
  const vakroByDate = new Map<string, number>();
  let purchaseRows = 0;
  const dates = new Set<string>();

  if (rows.length === 0) {
    errors.push({ rowNumber: 0, field: 'file', message: 'Excel file has no data rows' });
    return { valid: false, errors, summary: { purchaseRows: 0, vakroDays: 0, dateCount: 0 } };
  }

  for (const row of rows) {
    const hasPurchase =
      row.purchaseAmount !== undefined && row.purchaseAmount !== null && row.purchaseAmount > 0;
    const hasVakro = row.vakroAmount !== undefined && row.vakroAmount !== null;
    const store = row.storeName?.trim() ?? '';

    if (!row.date) {
      errors.push({ rowNumber: row.rowNumber, field: 'date', message: 'Date is required' });
    } else if (!isValidIsoDate(row.date)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'date',
        message: 'Date must be YYYY-MM-DD (e.g. 2026-06-15)',
      });
    } else if (!isDateNotFuture(row.date)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'date',
        message: 'Date cannot be in the future',
      });
    } else {
      dates.add(row.date);
    }

    if (hasPurchase) {
      purchaseRows += 1;
      if (!store) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'storeName',
          message: 'Store name is required when purchase amount is entered',
        });
      } else if (store.length > 200) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'storeName',
          message: 'Store name is too long (max 200 characters)',
        });
      }
      if (row.purchaseAmount! < 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'purchaseAmount',
          message: 'Purchase amount cannot be negative',
        });
      }
    }

    if (hasVakro) {
      if (row.vakroAmount! < 0) {
        errors.push({
          rowNumber: row.rowNumber,
          field: 'vakroAmount',
          message: 'Vakro amount cannot be negative',
        });
      } else if (row.date && isValidIsoDate(row.date)) {
        const prev = vakroByDate.get(row.date);
        if (prev !== undefined && prev !== row.vakroAmount) {
          errors.push({
            rowNumber: row.rowNumber,
            field: 'vakroAmount',
            message: `Vakro for ${row.date} must match other rows (expected ₹${prev})`,
          });
        } else {
          vakroByDate.set(row.date, row.vakroAmount!);
        }
      }
    }

    if (!hasPurchase && !hasVakro) {
      errors.push({
        rowNumber: row.rowNumber,
        field: 'row',
        message: 'Row must have purchase amount and store name, or vakro amount',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      purchaseRows,
      vakroDays: vakroByDate.size,
      dateCount: dates.size,
    },
  };
}

export async function importDataRows(
  shopId: string,
  rows: DataImportRow[],
): Promise<DataImportResult> {
  const preview = validateImportRows(rows);
  if (!preview.valid) {
    throw new Error(preview.errors[0]?.message ?? 'Import validation failed');
  }

  const vakroByDate = new Map<string, number>();
  let purchasesCreated = 0;

  for (const row of rows) {
    const hasPurchase =
      row.purchaseAmount !== undefined && row.purchaseAmount !== null && row.purchaseAmount > 0;
    if (hasPurchase && row.storeName?.trim()) {
      await createPurchase(shopId, {
        sourceName: row.storeName.trim(),
        amount: row.purchaseAmount!,
        date: row.date,
        note: 'Imported from Excel',
      });
      purchasesCreated += 1;
    }
    if (row.vakroAmount !== undefined && row.vakroAmount !== null) {
      vakroByDate.set(row.date, row.vakroAmount);
    }
  }

  for (const [date, amount] of vakroByDate) {
    await upsertVakro(shopId, { amount, date, note: 'Imported from Excel' });
  }

  return {
    purchasesCreated,
    vakroDaysUpserted: vakroByDate.size,
  };
}

export async function exportDataRows(
  shopId: string,
  opts: { from?: string; to?: string },
): Promise<DataExportRow[]> {
  const conditions = ['p.shop_id = $1'];
  const params: unknown[] = [shopId];
  let i = 2;

  if (opts.from) {
    conditions.push(`p.date >= $${i++}`);
    params.push(opts.from);
  }
  if (opts.to) {
    conditions.push(`p.date <= $${i++}`);
    params.push(opts.to);
  }

  const purchases = await query<{
    date: string;
    source_name: string;
    amount_paise: string;
    vakro_paise: string | null;
  }>(
    `SELECT p.date::text AS date, p.source_name, p.amount_paise::text AS amount_paise,
            v.amount_paise::text AS vakro_paise
     FROM daily_purchases p
     LEFT JOIN daily_vakro v ON v.shop_id = p.shop_id AND v.date = p.date
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.date ASC, p.source_name ASC`,
    params,
  );

  const rows: DataExportRow[] = purchases.rows.map((r) => ({
    date: r.date.slice(0, 10),
    storeName: r.source_name,
    purchaseRupees: paiseToRupees(Number(r.amount_paise)),
    vakroRupees: r.vakro_paise !== null ? paiseToRupees(Number(r.vakro_paise)) : null,
  }));

  const vakroConditions = ['v.shop_id = $1'];
  const vakroParams: unknown[] = [shopId];
  let j = 2;
  if (opts.from) {
    vakroConditions.push(`v.date >= $${j++}`);
    vakroParams.push(opts.from);
  }
  if (opts.to) {
    vakroConditions.push(`v.date <= $${j++}`);
    vakroParams.push(opts.to);
  }

  const vakroOnly = await query<{ date: string; amount_paise: string }>(
    `SELECT v.date::text AS date, v.amount_paise::text AS amount_paise
     FROM daily_vakro v
     WHERE ${vakroConditions.join(' AND ')}
       AND NOT EXISTS (
         SELECT 1 FROM daily_purchases p
         WHERE p.shop_id = v.shop_id AND p.date = v.date
       )
     ORDER BY v.date ASC`,
    vakroParams,
  );

  for (const v of vakroOnly.rows) {
    rows.push({
      date: v.date.slice(0, 10),
      storeName: null,
      purchaseRupees: null,
      vakroRupees: paiseToRupees(Number(v.amount_paise)),
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || (a.storeName ?? '').localeCompare(b.storeName ?? ''));
  return rows;
}
