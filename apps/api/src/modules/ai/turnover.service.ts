import { query } from '../../db/pool.js';
import { paiseToRupees } from '../../utils/money.js';
import { todayIso, monthStart, monthEnd, currentMonth, startOfWeekIso } from '../../utils/dates.js';
import { getTargetProgress, formatLakh } from '../../services/target.service.js';
import { festivalsForMonth } from '../calendar/festivals.data.js';
import { DEFAULT_PROFIT_MARGIN_PERCENT, profitFromVakroPaise } from '@turnover/shared';

export type TurnoverPeriod = 'week' | 'month' | 'all';

interface PeriodRange {
  from?: string;
  to: string;
  label: string;
}

function periodRange(period: TurnoverPeriod): PeriodRange {
  const today = todayIso();
  if (period === 'week') {
    return { from: startOfWeekIso(), to: today, label: 'This week' };
  }
  if (period === 'month') {
    return { from: monthStart(currentMonth()), to: today, label: 'This month' };
  }
  return { to: today, label: 'All time' };
}

async function aggregateTurnover(shopId: string, from: string | undefined, to: string) {
  const purchaseParams: unknown[] = [shopId];
  let purchaseWhere = 'shop_id = $1';
  if (from) {
    purchaseParams.push(from, to);
    purchaseWhere += ' AND date >= $2 AND date <= $3';
  }

  const vakroParams: unknown[] = [shopId];
  let vakroWhere = 'shop_id = $1';
  if (from) {
    vakroParams.push(from, to);
    vakroWhere += ' AND date >= $2 AND date <= $3';
  }

  const purchases = await query<{ total: string; paid: string }>(
    `SELECT COALESCE(SUM(amount_paise),0)::text AS total,
            COALESCE(SUM(paid_amount_paise),0)::text AS paid
     FROM daily_purchases WHERE ${purchaseWhere}`,
    from ? purchaseParams : [shopId],
  );

  const vakro = await query<{ total: string; days: string }>(
    `SELECT COALESCE(SUM(amount_paise),0)::text AS total, COUNT(*)::text AS days
     FROM daily_vakro WHERE ${vakroWhere}`,
    from ? vakroParams : [shopId],
  );

  const totalPurchases = Number(purchases.rows[0].total);
  const totalPaid = Number(purchases.rows[0].paid);
  const totalVakro = Number(vakro.rows[0].total);
  const vakroDays = Number(vakro.rows[0].days);
  const profit = profitFromVakroPaise(totalVakro);
  const avgDailyKamai = vakroDays > 0 ? Math.round(totalVakro / vakroDays) : 0;

  const topStore = await query<{ source_name: string; total: string }>(
    `SELECT source_name, SUM(amount_paise)::text AS total
     FROM daily_purchases WHERE ${purchaseWhere}
     GROUP BY source_name ORDER BY SUM(amount_paise) DESC LIMIT 1`,
    from ? purchaseParams : [shopId],
  );

  return {
    totalPurchasesPaise: totalPurchases,
    totalPaidPaise: totalPaid,
    totalPendingPayPaise: totalPurchases - totalPaid,
    totalVakroPaise: totalVakro,
    profitPaise: profit,
    vakroDays,
    avgDailyKamaiPaise: avgDailyKamai,
    topPurchaseStore: topStore.rows[0]?.source_name ?? null,
  };
}

function buildSuggestions(input: {
  period: TurnoverPeriod;
  stats: Awaited<ReturnType<typeof aggregateTurnover>>;
  targetProgress: Awaited<ReturnType<typeof getTargetProgress>> | null;
  upcomingFestivals: { nameGu: string; nameHi: string; date: string }[];
}): string[] {
  const suggestions: string[] = [];
  const { stats, targetProgress, upcomingFestivals } = input;

  if (stats.vakroDays === 0) {
    suggestions.push('Har raat Vakro entry karo — bina data ke turnover analysis nahi hoga.');
    return suggestions;
  }

  if (stats.profitPaise > 0) {
    suggestions.push(
      `Profit ${DEFAULT_PROFIT_MARGIN_PERCENT}% of Vakro: ${formatLakh(stats.profitPaise)}. Roz Vakro sahi enter karo taaki profit track rahe.`,
    );
  }

  if (stats.totalPendingPayPaise > 0) {
    suggestions.push(
      `₹${paiseToRupees(stats.totalPendingPayPaise).toLocaleString('en-IN')} supplier ko dena baaki — cash flow manage karo, pehle purana pending clear karo.`,
    );
  }

  if (targetProgress?.targetPaise) {
    if (targetProgress.pendingPaise && targetProgress.pendingPaise > 0) {
      suggestions.push(
        `Target ${formatLakh(targetProgress.targetPaise)} me se ${formatLakh(targetProgress.achievedPaise)} cover (${targetProgress.percentCovered}%). Abhi ${formatLakh(targetProgress.pendingPaise)} baaki hai.`,
      );
      if (targetProgress.dailyNeededPaise && targetProgress.daysRemaining) {
        suggestions.push(
          `Agle ${targetProgress.daysRemaining} din roz ~${formatLakh(targetProgress.dailyNeededPaise)} Vakro chahiye target ke liye.`,
        );
      }
    } else if (targetProgress.percentCovered !== null && targetProgress.percentCovered >= 100) {
      suggestions.push('🎉 Monthly target achieve ho gaya! Agle mahine thoda target badha kar try karo.');
    }
  } else {
    suggestions.push('Reports page par monthly target set karo (jaise July 15 Lakh) — progress track hoga.');
  }

  if (upcomingFestivals.length > 0) {
    const next = upcomingFestivals[0];
    suggestions.push(
      `Aane wala tyohar: ${next.nameGu} (${next.nameHi}) ${next.date} — stock badhao, decoration & mithai se sale badhti hai.`,
    );
  }

  if (stats.avgDailyKamaiPaise > 0 && stats.topPurchaseStore) {
    suggestions.push(
      `Sabse zyada purchase: ${stats.topPurchaseStore} se. Rate compare karo aur slow-moving item kam kharido.`,
    );
  }

  if (input.period === 'week' && stats.vakroDays < 5) {
    suggestions.push('Is hafte kam din ka Vakro enter hua — roz enter karo taaki week report sahi rahe.');
  }

  return suggestions.slice(0, 6);
}

export async function getAiTurnoverAnalysis(shopId: string, period: TurnoverPeriod) {
  const range = periodRange(period);
  const stats = await aggregateTurnover(shopId, range.from, range.to);

  const month = currentMonth();
  const targetProgress = await getTargetProgress(shopId, month);

  const today = todayIso();
  const upcomingFestivals = festivalsForMonth(month)
    .filter((f) => f.date >= today)
    .slice(0, 3)
    .map((f) => ({ date: f.date, nameHi: f.nameHi, nameGu: f.nameGu }));

  const insights = buildSuggestions({ period, stats, targetProgress, upcomingFestivals });

  const marginPercent =
    stats.totalVakroPaise > 0 ? DEFAULT_PROFIT_MARGIN_PERCENT : 0;

  return {
    period,
    label: range.label,
    from: range.from ?? null,
    to: range.to,
    summary: {
      totalVakroPaise: stats.totalVakroPaise,
      totalPurchasesPaise: stats.totalPurchasesPaise,
      profitPaise: stats.profitPaise,
      marginPercent,
      avgDailyKamaiPaise: stats.avgDailyKamaiPaise,
      vakroDays: stats.vakroDays,
    },
    target: targetProgress,
    upcomingFestivals,
    suggestions: insights,
    poweredBy: 'TurnOverCheck Smart Analysis',
  };
}
