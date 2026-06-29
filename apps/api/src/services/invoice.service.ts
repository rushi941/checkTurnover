import { query } from '../db/pool.js';
import { rupeesToPaise } from '../utils/money.js';
import { todayIso } from '../utils/dates.js';
import type { GstInvoice } from '@turnover/shared';

function fiscalYear(date: string): number {
  const d = new Date(`${date}T12:00:00`);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return month >= 4 ? year : year - 1;
}

async function nextInvoiceNo(shopId: string, date: string, prefix: string): Promise<string> {
  const fy = fiscalYear(date);
  const { rows } = await query<{ last_number: number }>(
    `INSERT INTO invoice_sequences (shop_id, fiscal_year, last_number)
     VALUES ($1, $2, 1)
     ON CONFLICT (shop_id, fiscal_year)
     DO UPDATE SET last_number = invoice_sequences.last_number + 1
     RETURNING last_number`,
    [shopId, fy],
  );
  const num = rows[0].last_number;
  return `${prefix}-${fy}-${String(num).padStart(4, '0')}`;
}

function mapInvoice(row: {
  id: string;
  shop_id: string;
  invoice_no: string;
  date: Date | string;
  lines_json: unknown;
  taxable_total_paise: string;
  cgst_paise: string;
  sgst_paise: string;
  igst_paise: string;
  grand_total_paise: string;
  created_at: Date;
}): GstInvoice {
  const lines = (row.lines_json ?? []) as GstInvoice['lines'];
  return {
    id: row.id,
    shopId: row.shop_id,
    invoiceNo: row.invoice_no,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date.toISOString().slice(0, 10),
    lines,
    taxableTotalPaise: Number(row.taxable_total_paise),
    cgstPaise: Number(row.cgst_paise),
    sgstPaise: Number(row.sgst_paise),
    igstPaise: Number(row.igst_paise),
    grandTotalPaise: Number(row.grand_total_paise),
    createdAt: row.created_at.toISOString(),
  };
}

export async function listInvoices(shopId: string, limit = 50): Promise<GstInvoice[]> {
  const { rows } = await query(
    `SELECT * FROM gst_invoices WHERE shop_id = $1 ORDER BY date DESC, created_at DESC LIMIT $2`,
    [shopId, limit],
  );
  return rows.map((r) => mapInvoice(r as never));
}

export async function createInvoice(
  shopId: string,
  input: {
    customerName: string;
    description?: string;
    amount: number;
    date?: string;
    gstPercent?: number;
  },
): Promise<GstInvoice> {
  const date = input.date ?? todayIso();
  const gstPercent = input.gstPercent ?? 0;
  const grandPaise = rupeesToPaise(input.amount);

  let taxablePaise = grandPaise;
  let cgstPaise = 0;
  let sgstPaise = 0;

  if (gstPercent > 0) {
    taxablePaise = Math.round(grandPaise / (1 + gstPercent / 100));
    const taxPaise = grandPaise - taxablePaise;
    cgstPaise = Math.floor(taxPaise / 2);
    sgstPaise = taxPaise - cgstPaise;
  }

  const shopRes = await query<{ invoice_prefix: string }>(
    'SELECT invoice_prefix FROM shops WHERE id = $1',
    [shopId],
  );
  const prefix = shopRes.rows[0]?.invoice_prefix ?? 'INV';
  const invoiceNo = await nextInvoiceNo(shopId, date, prefix);

  const lines = [
    {
      description: input.description?.trim() || 'Goods / services',
      customerName: input.customerName.trim(),
      amountPaise: grandPaise,
    },
  ];

  const { rows } = await query(
    `INSERT INTO gst_invoices (
       shop_id, invoice_no, date, lines_json,
       taxable_total_paise, cgst_paise, sgst_paise, igst_paise, grand_total_paise
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
     RETURNING *`,
    [
      shopId,
      invoiceNo,
      date,
      JSON.stringify(lines),
      taxablePaise,
      cgstPaise,
      sgstPaise,
      grandPaise,
    ],
  );

  return mapInvoice(rows[0] as never);
}

export async function getShopForInvoice(shopId: string) {
  const { rows } = await query<{
    name: string;
    address: string | null;
    gstin: string | null;
    owner_name: string | null;
    phone: string | null;
    city: string | null;
  }>(
    `SELECT name, address, gstin, owner_name, phone, city FROM shops WHERE id = $1`,
    [shopId],
  );
  return rows[0] ?? null;
}
