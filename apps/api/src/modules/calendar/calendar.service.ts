import { query } from '../../db/pool.js';
import { monthStart, monthEnd } from '../../utils/dates.js';
import { profitFromVakroPaise } from '@turnover/shared';
import { festivalsForMonth, festivalOnDate } from './festivals.data.js';
import { getPanchangForMonth } from './panchang.service.js';

export async function getCalendarMonth(shopId: string, month: string) {
  const from = monthStart(month);
  const to = monthEnd(month);

  const vakroRows = await query<{ date: string; total: string }>(
    `SELECT date::text, amount_paise::text AS total FROM daily_vakro
     WHERE shop_id = $1 AND date >= $2 AND date <= $3`,
    [shopId, from, to],
  );

  const purchaseRows = await query<{ date: string; total: string }>(
    `SELECT date::text, COALESCE(SUM(amount_paise), 0)::text AS total
     FROM daily_purchases WHERE shop_id = $1 AND date >= $2 AND date <= $3
     GROUP BY date`,
    [shopId, from, to],
  );

  const vakroMap = new Map(vakroRows.rows.map((r) => [r.date.slice(0, 10), Number(r.total)]));
  const purchaseMap = new Map(purchaseRows.rows.map((r) => [r.date.slice(0, 10), Number(r.total)]));

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const festivals = festivalsForMonth(month);
  const panchangMap = getPanchangForMonth(month);

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const kamaiPaise = vakroMap.get(date) ?? null;
    const purchasesPaise = purchaseMap.get(date) ?? 0;
    const profitPaise =
      kamaiPaise !== null ? profitFromVakroPaise(kamaiPaise) : null;
    const festival = festivalOnDate(date);
    const panchang = panchangMap.get(date);

    days.push({
      date,
      kamaiPaise,
      purchasesPaise,
      profitPaise,
      festival: festival
        ? { nameHi: festival.nameHi, nameGu: festival.nameGu, category: festival.category }
        : null,
      tithi: panchang?.tithi ?? null,
      tithis: panchang?.tithis ?? [],
      nakshatra: panchang?.nakshatra ?? null,
      varaHi: panchang?.varaHi ?? null,
      varaEn: panchang?.varaEn ?? null,
      sunrise: panchang?.sunrise ?? null,
      sunset: panchang?.sunset ?? null,
      choghadiya: panchang?.choghadiya ?? null,
    });
  }

  return {
    month,
    days,
    festivals: festivals.map((f) => ({
      date: f.date,
      nameHi: f.nameHi,
      nameGu: f.nameGu,
      category: f.category,
    })),
  };
}
