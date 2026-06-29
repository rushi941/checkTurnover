import { query } from '../db/pool.js';
import { rupeesToPaise } from '../utils/money.js';
import { mapVakro } from '../utils/mappers.js';
import { todayIso } from '../utils/dates.js';

export async function upsertVakro(
  shopId: string,
  input: { amount: number; date?: string; note?: string },
) {
  const date = input.date ?? todayIso();
  const amountPaise = rupeesToPaise(input.amount);

  const { rows } = await query(
    `INSERT INTO daily_vakro (shop_id, date, amount_paise, note)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (shop_id, date)
     DO UPDATE SET amount_paise = EXCLUDED.amount_paise, note = EXCLUDED.note, updated_at = NOW()
     RETURNING *`,
    [shopId, date, amountPaise, input.note ?? null],
  );
  return mapVakro(rows[0] as never);
}

export async function getVakro(shopId: string, date: string) {
  const { rows } = await query('SELECT * FROM daily_vakro WHERE shop_id = $1 AND date = $2', [
    shopId,
    date,
  ]);
  if (rows.length === 0) return null;
  return mapVakro(rows[0] as never);
}

async function supplierPaidOnDate(shopId: string, date: string): Promise<number> {
  const { rows } = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount_paise), 0)::text AS total
     FROM purchase_payments WHERE shop_id = $1 AND payment_date = $2`,
    [shopId, date],
  );
  return Number(rows[0].total);
}

async function kharchoOnDate(shopId: string, date: string): Promise<number> {
  const { rows } = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount_paise), 0)::text AS total
     FROM shop_kharcho WHERE shop_id = $1 AND date = $2`,
    [shopId, date],
  );
  return Number(rows[0].total);
}

export async function getVakroDayDetail(shopId: string, date: string) {
  const vakro = await getVakro(shopId, date);
  const supplierPaidPaise = await supplierPaidOnDate(shopId, date);
  const kharchoPaise = await kharchoOnDate(shopId, date);
  const vakroPaise = vakro?.amountPaise ?? null;
  const netCashPaise =
    vakroPaise !== null ? vakroPaise - supplierPaidPaise - kharchoPaise : null;

  return {
    date,
    vakro,
    vakroPaise,
    supplierPaidPaise,
    kharchoPaise,
    netCashPaise,
    vakroEntered: vakro !== null,
  };
}

export async function listVakroByDate(shopId: string, from: string, to: string) {
  const { rows } = await query<{
    date: string;
    vakro_paise: string | null;
    note: string | null;
    supplier_paid_paise: string;
    kharcho_paise: string;
  }>(
    `WITH dates AS (
       SELECT date::text AS d FROM daily_vakro
       WHERE shop_id = $1 AND date >= $2 AND date <= $3
       UNION
       SELECT payment_date::text FROM purchase_payments
       WHERE shop_id = $1 AND payment_date >= $2 AND payment_date <= $3
       UNION
       SELECT date::text FROM shop_kharcho
       WHERE shop_id = $1 AND date >= $2 AND date <= $3
     ),
     vakro AS (
       SELECT date::text AS d, amount_paise, note
       FROM daily_vakro WHERE shop_id = $1 AND date >= $2 AND date <= $3
     ),
     paid AS (
       SELECT payment_date::text AS d, COALESCE(SUM(amount_paise), 0)::bigint AS total
       FROM purchase_payments
       WHERE shop_id = $1 AND payment_date >= $2 AND payment_date <= $3
       GROUP BY payment_date
     ),
     kharcho AS (
       SELECT date::text AS d, COALESCE(SUM(amount_paise), 0)::bigint AS total
       FROM shop_kharcho
       WHERE shop_id = $1 AND date >= $2 AND date <= $3
       GROUP BY date
     )
     SELECT dates.d AS date,
            v.amount_paise::text AS vakro_paise,
            v.note,
            COALESCE(p.total, 0)::text AS supplier_paid_paise,
            COALESCE(k.total, 0)::text AS kharcho_paise
     FROM dates
     LEFT JOIN vakro v ON v.d = dates.d
     LEFT JOIN paid p ON p.d = dates.d
     LEFT JOIN kharcho k ON k.d = dates.d
     ORDER BY dates.d DESC`,
    [shopId, from, to],
  );

  return rows.map((r) => {
    const vakroPaise = r.vakro_paise !== null ? Number(r.vakro_paise) : null;
    const supplierPaidPaise = Number(r.supplier_paid_paise);
    const kharchoPaise = Number(r.kharcho_paise);
    const netCashPaise =
      vakroPaise !== null ? vakroPaise - supplierPaidPaise - kharchoPaise : null;
    return {
      date: r.date.slice(0, 10),
      vakroPaise,
      supplierPaidPaise,
      kharchoPaise,
      netCashPaise,
      note: r.note,
      vakroEntered: vakroPaise !== null,
    };
  });
}
