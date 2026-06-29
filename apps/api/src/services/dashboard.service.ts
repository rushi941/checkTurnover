import { query } from '../db/pool.js';
import { mapPurchase } from '../utils/mappers.js';
import type { DashboardData, MonthlyReport } from '@turnover/shared';
import {
  DEFAULT_PROFIT_MARGIN_PERCENT,
  profitFromVakroAfterKharcho,
  profitFromVakroPaise,
} from '@turnover/shared';
import { getVakro } from './vakro.service.js';
import { getKharchoForDate } from './kharcho.service.js';
import { monthStart, monthEnd } from '../utils/dates.js';

export async function getDashboard(shopId: string, date: string): Promise<DashboardData> {
  const purchases = await query(
    `SELECT * FROM daily_purchases WHERE shop_id = $1 AND date = $2 ORDER BY created_at ASC`,
    [shopId, date],
  );

  const rows = purchases.rows.map((r) => mapPurchase(r as never));
  const totalPurchasesPaise = rows.reduce((sum, r) => sum + r.amountPaise, 0);
  const totalPaidPaise = rows.reduce((sum, r) => sum + r.paidAmountPaise, 0);
  const totalPendingPaise = totalPurchasesPaise - totalPaidPaise;

  const kharchoRows = await getKharchoForDate(shopId, date);
  const totalKharchoPaise = kharchoRows.reduce((sum, r) => sum + r.amountPaise, 0);

  const vakro = await getVakro(shopId, date);
  const vakroPaise = vakro?.amountPaise ?? null;
  const margin = DEFAULT_PROFIT_MARGIN_PERCENT;
  const profitPaise =
    vakroPaise !== null ? profitFromVakroPaise(vakroPaise, margin) : null;
  const netProfitPaise =
    vakroPaise !== null
      ? profitFromVakroAfterKharcho(vakroPaise, totalKharchoPaise, margin)
      : null;

  return {
    date,
    totalPurchasesPaise,
    totalPaidPaise,
    totalPendingPaise,
    totalKharchoPaise,
    vakroPaise,
    profitPaise,
    netProfitPaise,
    profitMarginPercent: margin,
    purchaseRows: rows,
    kharchoRows,
    vakroEntered: vakro !== null,
  };
}

export async function getMonthlyReport(shopId: string, month: string): Promise<MonthlyReport> {
  const from = monthStart(month);
  const to = monthEnd(month);
  const margin = DEFAULT_PROFIT_MARGIN_PERCENT;

  const purchaseByDay = await query<{ date: string; total: string }>(
    `SELECT date::text, COALESCE(SUM(amount_paise), 0)::text AS total
     FROM daily_purchases
     WHERE shop_id = $1 AND date >= $2 AND date <= $3
     GROUP BY date`,
    [shopId, from, to],
  );

  const vakroByDay = await query<{ date: string; total: string }>(
    `SELECT date::text, amount_paise::text AS total
     FROM daily_vakro
     WHERE shop_id = $1 AND date >= $2 AND date <= $3`,
    [shopId, from, to],
  );

  const kharchoByDay = await query<{ date: string; total: string }>(
    `SELECT date::text, COALESCE(SUM(amount_paise), 0)::text AS total
     FROM shop_kharcho
     WHERE shop_id = $1 AND date >= $2 AND date <= $3
     GROUP BY date`,
    [shopId, from, to],
  );

  const purchaseMap = new Map(
    purchaseByDay.rows.map((r) => [r.date.slice(0, 10), Number(r.total)]),
  );
  const vakroMap = new Map(vakroByDay.rows.map((r) => [r.date.slice(0, 10), Number(r.total)]));
  const kharchoMap = new Map(
    kharchoByDay.rows.map((r) => [r.date.slice(0, 10), Number(r.total)]),
  );

  const allDates = new Set([
    ...purchaseMap.keys(),
    ...vakroMap.keys(),
    ...kharchoMap.keys(),
  ]);

  const days = [...allDates]
    .sort()
    .map((date) => {
      const purchasesPaise = purchaseMap.get(date) ?? 0;
      const kharchoPaise = kharchoMap.get(date) ?? 0;
      const vakroPaise = vakroMap.has(date) ? vakroMap.get(date)! : null;
      const profitPaise =
        vakroPaise !== null
          ? profitFromVakroAfterKharcho(vakroPaise, kharchoPaise, margin)
          : null;
      return { date, purchasesPaise, kharchoPaise, vakroPaise, profitPaise };
    });

  const totalPurchasesPaise = days.reduce((s, d) => s + d.purchasesPaise, 0);
  const totalKharchoPaise = days.reduce((s, d) => s + d.kharchoPaise, 0);
  const totalVakroPaise = days.reduce((s, d) => s + (d.vakroPaise ?? 0), 0);
  const totalProfitPaise =
    profitFromVakroPaise(totalVakroPaise, margin) - totalKharchoPaise;

  return {
    month,
    totalPurchasesPaise,
    totalKharchoPaise,
    totalVakroPaise,
    totalProfitPaise,
    profitMarginPercent: margin,
    days,
  };
}
