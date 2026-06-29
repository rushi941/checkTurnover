import { query } from '../db/pool.js';
import { rupeesToPaise } from '../utils/money.js';
import { mapKharcho } from '../utils/mappers.js';
import { todayIso } from '../utils/dates.js';
import {
  kharchoCategoryLabel,
  type KharchoCategory,
  type KharchoSummary,
} from '@turnover/shared';

function buildKharchoFilters(
  shopId: string,
  opts: { from?: string; to?: string; category?: string },
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
  if (opts.category && opts.category !== 'all') {
    conditions.push(`category = $${i++}`);
    params.push(opts.category);
  }

  return { where: conditions.join(' AND '), params };
}

export async function createKharcho(
  shopId: string,
  input: { category: KharchoCategory; amount: number; date?: string; note?: string },
) {
  const date = input.date ?? todayIso();
  const amountPaise = rupeesToPaise(input.amount);

  const { rows } = await query(
    `INSERT INTO shop_kharcho (shop_id, date, category, amount_paise, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [shopId, date, input.category, amountPaise, input.note ?? null],
  );

  return mapKharcho(rows[0] as never);
}

export async function updateKharcho(
  shopId: string,
  kharchoId: string,
  input: { category?: KharchoCategory; amount?: number; date?: string; note?: string },
) {
  const existing = await query(
    'SELECT * FROM shop_kharcho WHERE id = $1 AND shop_id = $2',
    [kharchoId, shopId],
  );
  if (existing.rows.length === 0) return null;

  const row = existing.rows[0] as {
    category: string;
    amount_paise: string;
    date: string;
    note: string | null;
  };

  const category = input.category ?? row.category;
  const amountPaise =
    input.amount !== undefined ? rupeesToPaise(input.amount) : Number(row.amount_paise);
  const date = input.date ?? String(row.date).slice(0, 10);
  const note = input.note !== undefined ? input.note : row.note;

  const { rows } = await query(
    `UPDATE shop_kharcho
     SET category = $1, amount_paise = $2, date = $3, note = $4, updated_at = NOW()
     WHERE id = $5 AND shop_id = $6
     RETURNING *`,
    [category, amountPaise, date, note, kharchoId, shopId],
  );

  return mapKharcho(rows[0] as never);
}

export async function deleteKharcho(shopId: string, kharchoId: string) {
  const { rowCount } = await query(
    'DELETE FROM shop_kharcho WHERE id = $1 AND shop_id = $2',
    [kharchoId, shopId],
  );
  return (rowCount ?? 0) > 0;
}

export async function listKharcho(
  shopId: string,
  opts: { from?: string; to?: string; category?: string; page?: number; limit?: number },
) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 100, 200);
  const offset = (page - 1) * limit;

  const { where, params } = buildKharchoFilters(shopId, opts);

  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM shop_kharcho WHERE ${where}`,
    params,
  );

  const { rows } = await query(
    `SELECT * FROM shop_kharcho WHERE ${where}
     ORDER BY date DESC, created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  return {
    data: rows.map((r) => mapKharcho(r as never)),
    meta: { page, limit, total: Number(countRes.rows[0].count) },
  };
}

export async function getKharchoSummary(
  shopId: string,
  opts: { from?: string; to?: string; category?: string },
): Promise<KharchoSummary> {
  const { where, params } = buildKharchoFilters(shopId, opts);

  const totals = await query<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(amount_paise), 0)::text AS total,
            COUNT(*)::text AS count
     FROM shop_kharcho WHERE ${where}`,
    params,
  );

  const byCategory = await query<{ category: string; total: string; count: string }>(
    `SELECT category,
            SUM(amount_paise)::text AS total,
            COUNT(*)::text AS count
     FROM shop_kharcho WHERE ${where}
     GROUP BY category
     ORDER BY SUM(amount_paise) DESC`,
    params,
  );

  return {
    totalPaise: Number(totals.rows[0].total),
    entryCount: Number(totals.rows[0].count),
    byCategory: byCategory.rows.map((r) => ({
      category: r.category as KharchoCategory,
      categoryLabel: kharchoCategoryLabel(r.category as KharchoCategory),
      totalPaise: Number(r.total),
      entryCount: Number(r.count),
    })),
  };
}

export async function getKharchoForDate(shopId: string, date: string) {
  const { rows } = await query(
    `SELECT * FROM shop_kharcho WHERE shop_id = $1 AND date = $2 ORDER BY created_at ASC`,
    [shopId, date],
  );
  return rows.map((r) => mapKharcho(r as never));
}

export async function getKharchoTotalForDate(shopId: string, date: string): Promise<number> {
  const { rows } = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount_paise), 0)::text AS total
     FROM shop_kharcho WHERE shop_id = $1 AND date = $2`,
    [shopId, date],
  );
  return Number(rows[0].total);
}
