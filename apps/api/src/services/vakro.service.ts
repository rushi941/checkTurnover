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
