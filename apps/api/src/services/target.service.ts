import { query } from '../db/pool.js';
import { rupeesToPaise, paiseToRupees } from '../utils/money.js';
import { monthStart, monthEnd, todayIso } from '../utils/dates.js';

export async function getMonthlyTarget(shopId: string, month: string) {
  const { rows } = await query<{ target_paise: string }>(
    'SELECT target_paise FROM monthly_targets WHERE shop_id = $1 AND month = $2',
    [shopId, month],
  );
  if (rows.length === 0) return null;
  return Number(rows[0].target_paise);
}

export async function setMonthlyTarget(shopId: string, month: string, targetRupees: number) {
  const targetPaise = rupeesToPaise(targetRupees);
  await query(
    `INSERT INTO monthly_targets (shop_id, month, target_paise)
     VALUES ($1, $2, $3)
     ON CONFLICT (shop_id, month)
     DO UPDATE SET target_paise = EXCLUDED.target_paise, updated_at = NOW()`,
    [shopId, month, targetPaise],
  );
  return targetPaise;
}

export async function getTargetProgress(shopId: string, month: string) {
  const targetPaise = await getMonthlyTarget(shopId, month);
  const from = monthStart(month);
  const to = monthEnd(month);

  const vakroRes = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount_paise), 0)::text AS total FROM daily_vakro
     WHERE shop_id = $1 AND date >= $2 AND date <= $3`,
    [shopId, from, to],
  );
  const achievedPaise = Number(vakroRes.rows[0].total);
  const pendingPaise = targetPaise !== null ? Math.max(0, targetPaise - achievedPaise) : null;
  const percent =
    targetPaise && targetPaise > 0 ? Math.min(100, Math.round((achievedPaise / targetPaise) * 100)) : null;

  const today = todayIso();
  const daysInMonth = new Date(parseInt(month.slice(0, 4)), parseInt(month.slice(5)), 0).getDate();
  const currentDay =
    month === today.slice(0, 7) ? parseInt(today.slice(8), 10) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - currentDay);
  const dailyNeededPaise =
    pendingPaise !== null && daysRemaining > 0 ? Math.ceil(pendingPaise / daysRemaining) : null;

  return {
    month,
    targetPaise,
    achievedPaise,
    pendingPaise,
    percentCovered: percent,
    daysRemaining,
    dailyNeededPaise,
  };
}

export function formatLakh(paise: number): string {
  const rupees = paiseToRupees(paise);
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} Lakh`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}
