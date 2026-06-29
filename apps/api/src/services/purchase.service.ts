import { query } from '../db/pool.js';
import { rupeesToPaise } from '../utils/money.js';
import { mapPurchase } from '../utils/mappers.js';
import { todayIso } from '../utils/dates.js';
import type { PurchasesSummary } from '@turnover/shared';
import { recordPayment } from './payment.service.js';

export async function upsertPurchaseSource(shopId: string, name: string) {
  await query(
    `INSERT INTO purchase_sources (shop_id, name) VALUES ($1, $2)
     ON CONFLICT (shop_id, name) DO NOTHING`,
    [shopId, name.trim()],
  );
}

export async function createPurchase(
  shopId: string,
  input: {
    sourceName: string;
    amount: number;
    date?: string;
    note?: string;
    paidAmount?: number;
  },
) {
  const date = input.date ?? todayIso();
  const amountPaise = rupeesToPaise(input.amount);
  const paidPaise =
    input.paidAmount !== undefined ? rupeesToPaise(input.paidAmount) : 0;
  if (paidPaise > amountPaise) {
    throw new Error('Paid amount cannot exceed purchase amount');
  }

  const sourceName = input.sourceName.trim();
  await upsertPurchaseSource(shopId, sourceName);

  const { rows } = await query(
    `INSERT INTO daily_purchases (shop_id, date, source_name, amount_paise, paid_amount_paise, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [shopId, date, sourceName, amountPaise, paidPaise, input.note ?? null],
  );

  const purchase = mapPurchase(rows[0] as never);

  if (paidPaise > 0) {
    await query(
      `INSERT INTO purchase_payments (purchase_id, shop_id, amount_paise, payment_date, payment_mode, note)
       VALUES ($1, $2, $3, $4, 'cash', 'Paid on purchase')`,
      [purchase.id, shopId, paidPaise, date],
    );
  }

  return purchase;
}

export async function updatePurchase(
  shopId: string,
  purchaseId: string,
  input: { sourceName?: string; amount?: number; note?: string },
) {
  const existing = await query(
    'SELECT * FROM daily_purchases WHERE id = $1 AND shop_id = $2',
    [purchaseId, shopId],
  );
  if (existing.rows.length === 0) return null;

  const row = existing.rows[0] as {
    source_name: string;
    amount_paise: string;
    paid_amount_paise: string;
    note: string | null;
  };

  const sourceName = input.sourceName?.trim() ?? row.source_name;
  const amountPaise =
    input.amount !== undefined ? rupeesToPaise(input.amount) : Number(row.amount_paise);
  const paidPaise = Number(row.paid_amount_paise ?? 0);

  if (amountPaise < paidPaise) {
    throw new Error('Purchase amount cannot be less than already paid amount');
  }

  const note = input.note !== undefined ? input.note : row.note;
  if (input.sourceName) await upsertPurchaseSource(shopId, sourceName);

  const { rows } = await query(
    `UPDATE daily_purchases
     SET source_name = $1, amount_paise = $2, note = $3, updated_at = NOW()
     WHERE id = $4 AND shop_id = $5 RETURNING *`,
    [sourceName, amountPaise, note, purchaseId, shopId],
  );
  return mapPurchase(rows[0] as never);
}

export async function deletePurchase(shopId: string, purchaseId: string) {
  const { rowCount } = await query(
    'DELETE FROM daily_purchases WHERE id = $1 AND shop_id = $2',
    [purchaseId, shopId],
  );
  return (rowCount ?? 0) > 0;
}

function buildPurchaseFilters(
  shopId: string,
  opts: { from?: string; to?: string; source?: string; search?: string; paymentStatus?: string },
) {
  const conditions = ['shop_id = $1'];
  const params: unknown[] = [shopId];
  let i = 2;

  if (opts.from) {
    conditions.push(`date >= $${i++}`);
    params.push(opts.from);
  }
  if (opts.to) {
    conditions.push(`date <= $${i++}`);
    params.push(opts.to);
  }
  if (opts.source) {
    conditions.push(`source_name = $${i++}`);
    params.push(opts.source);
  }
  if (opts.search) {
    conditions.push(`source_name ILIKE $${i++}`);
    params.push(`%${opts.search}%`);
  }
  if (opts.paymentStatus === 'paid') {
    conditions.push('paid_amount_paise >= amount_paise AND amount_paise > 0');
  } else if (opts.paymentStatus === 'partial') {
    conditions.push('paid_amount_paise > 0 AND paid_amount_paise < amount_paise');
  } else if (opts.paymentStatus === 'pending' || opts.paymentStatus === 'unpaid') {
    conditions.push('paid_amount_paise = 0');
  }

  return { where: conditions.join(' AND '), params, nextIndex: i };
}

export async function listPurchases(
  shopId: string,
  opts: {
    from?: string;
    to?: string;
    source?: string;
    search?: string;
    paymentStatus?: string;
    sort?: string;
    page?: number;
    limit?: number;
  },
) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = (page - 1) * limit;

  const { where, params, nextIndex: i } = buildPurchaseFilters(shopId, opts);

  let orderBy = 'date DESC, created_at DESC';
  if (opts.sort === 'amount_desc') orderBy = 'amount_paise DESC';
  if (opts.sort === 'amount_asc') orderBy = 'amount_paise ASC';
  if (opts.sort === 'source_asc') orderBy = 'source_name ASC, date DESC';

  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM daily_purchases WHERE ${where}`,
    params,
  );

  const { rows } = await query(
    `SELECT * FROM daily_purchases WHERE ${where}
     ORDER BY ${orderBy} LIMIT $${i} OFFSET $${i + 1}`,
    [...params, limit, offset],
  );

  return {
    data: rows.map((r) => mapPurchase(r as never)),
    meta: { page, limit, total: Number(countRes.rows[0].count) },
  };
}

export async function getPurchasesSummary(
  shopId: string,
  opts: { from?: string; to?: string; source?: string; search?: string; paymentStatus?: string },
): Promise<PurchasesSummary> {
  const { where, params } = buildPurchaseFilters(shopId, opts);

  const totals = await query<{
    total: string;
    paid: string;
    count: string;
    sources: string;
  }>(
    `SELECT COALESCE(SUM(amount_paise), 0)::text AS total,
            COALESCE(SUM(paid_amount_paise), 0)::text AS paid,
            COUNT(*)::text AS count,
            COUNT(DISTINCT source_name)::text AS sources
     FROM daily_purchases WHERE ${where}`,
    params,
  );

  const totalPaise = Number(totals.rows[0].total);
  const totalPaidPaise = Number(totals.rows[0].paid);

  const byStore = await query<{
    source_name: string;
    total_paise: string;
    paid_paise: string;
    entry_count: string;
    last_date: string;
  }>(
    `SELECT source_name,
            SUM(amount_paise)::text AS total_paise,
            SUM(paid_amount_paise)::text AS paid_paise,
            COUNT(*)::text AS entry_count,
            MAX(date)::text AS last_date
     FROM daily_purchases WHERE ${where}
     GROUP BY source_name
     ORDER BY SUM(amount_paise - paid_amount_paise) DESC, source_name ASC`,
    params,
  );

  return {
    totalPaise,
    totalPaidPaise,
    totalPendingPaise: totalPaise - totalPaidPaise,
    entryCount: Number(totals.rows[0].count),
    sourceCount: Number(totals.rows[0].sources),
    byStore: byStore.rows.map((r) => {
      const total = Number(r.total_paise);
      const paid = Number(r.paid_paise);
      return {
        sourceName: r.source_name,
        totalPaise: total,
        paidPaise: paid,
        pendingPaise: total - paid,
        entryCount: Number(r.entry_count),
        lastPurchaseDate: r.last_date.slice(0, 10),
      };
    }),
  };
}

export async function listPurchaseSources(shopId: string) {
  const { rows } = await query<{ name: string }>(
    `SELECT name FROM purchase_sources WHERE shop_id = $1 ORDER BY name ASC`,
    [shopId],
  );
  return rows.map((r) => r.name);
}

export { recordPayment, listPayments, markPurchasePaid, markPurchaseUnpaid, setPurchasePaidAmount } from './payment.service.js';
