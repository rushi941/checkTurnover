import { query } from '../../db/pool.js';
import { paiseToRupees } from '../../utils/money.js';
import { monthStart, monthEnd } from '../../utils/dates.js';
import { monthLabel, shiftMonth } from '@turnover/shared';
import { getMonthlyTarget, formatLakh } from '../../services/target.service.js';
import { festivalsForMonth, type FestivalEntry } from '../calendar/festivals.data.js';

export type FestivalImpact = 'high' | 'medium' | 'low';

export interface TargetSuggestion {
  month: string;
  monthLabel: string;
  lastYearMonth: string;
  lastYearMonthLabel: string;
  lastYear: {
    targetPaise: number | null;
    achievedPaise: number;
  } | null;
  recentThreeMonthAvgPaise: number | null;
  festivals: {
    date: string;
    nameHi: string;
    nameGu: string;
    impact: FestivalImpact;
  }[];
  suggestedTargetPaise: number;
  suggestedTargetRupees: number;
  basePaise: number;
  upliftPercent: number;
  basedOn: 'last_year_achieved' | 'last_year_target' | 'recent_average' | 'market_default';
  reasoning: string[];
}

function previousYearMonth(month: string): string {
  const y = parseInt(month.slice(0, 4), 10) - 1;
  return `${y}-${month.slice(5)}`;
}

function monthDisplayLabel(month: string): string {
  return monthLabel(month);
}

async function monthVakroTotal(shopId: string, month: string): Promise<number> {
  const { rows } = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount_paise), 0)::text AS total FROM daily_vakro
     WHERE shop_id = $1 AND date >= $2 AND date <= $3`,
    [shopId, monthStart(month), monthEnd(month)],
  );
  return Number(rows[0].total);
}

function festivalImpact(f: FestivalEntry): FestivalImpact {
  const hi = f.nameHi.toLowerCase();
  const gu = f.nameGu.toLowerCase();
  if (
    hi.includes('दीवाली') ||
    gu.includes('દીવાળી') ||
    hi.includes('नवरात') ||
    gu.includes('નવરાત્ર')
  ) {
    return 'high';
  }
  if (
    hi.includes('होली') ||
    gu.includes('હોળી') ||
    hi.includes('गणेश') ||
    gu.includes('ગણેશ') ||
    hi.includes('दशह') ||
    gu.includes('દશે')
  ) {
    return 'medium';
  }
  if (f.category === 'national') return 'low';
  return 'medium';
}

function computeUpliftPercent(festivals: FestivalEntry[]): number {
  let uplift = 8; // base kirana market YoY growth ~8%

  for (const f of festivals) {
    const impact = festivalImpact(f);
    if (impact === 'high') uplift += 10;
    else if (impact === 'medium') uplift += 4;
    else uplift += 1;
  }

  // Extra bump for festival-heavy months (3+ tyohar)
  if (festivals.length >= 3) uplift += 3;

  return Math.min(Math.round(uplift), 40);
}

function roundToNearestHalfLakh(paise: number): number {
  const halfLakh = 5000000; // ₹50,000 in paise — round to nearest 0.5 lakh for clean targets
  if (paise < halfLakh) return Math.ceil(paise / 100000) * 100000; // round to ₹1000 below 50k
  return Math.round(paise / halfLakh) * halfLakh;
}

export async function getTargetSuggestion(shopId: string, month: string): Promise<TargetSuggestion> {
  const lastYearMonth = previousYearMonth(month);
  const festivals = festivalsForMonth(month);
  const upliftPercent = computeUpliftPercent(festivals);

  const lastYearAchieved = await monthVakroTotal(shopId, lastYearMonth);
  const lastYearTarget = await getMonthlyTarget(shopId, lastYearMonth);

  const recentTotals: number[] = [];
  for (let i = 1; i <= 3; i += 1) {
    const m = shiftMonth(month, -i);
    const t = await monthVakroTotal(shopId, m);
    if (t > 0) recentTotals.push(t);
  }
  const recentThreeMonthAvgPaise =
    recentTotals.length > 0
      ? Math.round(recentTotals.reduce((a, b) => a + b, 0) / recentTotals.length)
      : null;

  let basePaise: number;
  let basedOn: TargetSuggestion['basedOn'];

  if (lastYearAchieved > 0) {
    basePaise = lastYearAchieved;
    basedOn = 'last_year_achieved';
  } else if (lastYearTarget !== null && lastYearTarget > 0) {
    basePaise = lastYearTarget;
    basedOn = 'last_year_target';
  } else if (recentThreeMonthAvgPaise !== null && recentThreeMonthAvgPaise > 0) {
    basePaise = recentThreeMonthAvgPaise;
    basedOn = 'recent_average';
  } else {
    basePaise = 150000000; // ₹15 Lakh default for new shops
    basedOn = 'market_default';
  }

  const rawSuggested = Math.round(basePaise * (1 + upliftPercent / 100));
  const suggestedTargetPaise = roundToNearestHalfLakh(rawSuggested);

  const reasoning: string[] = [];

  if (basedOn === 'last_year_achieved') {
    reasoning.push(
      `Pichle saal (${monthDisplayLabel(lastYearMonth)}) aapne ${formatLakh(lastYearAchieved)} Vakro achieve kiya.`,
    );
    if (lastYearTarget !== null && lastYearTarget > 0) {
      reasoning.push(`Us mahine target ${formatLakh(lastYearTarget)} tha.`);
    }
  } else if (basedOn === 'last_year_target') {
    reasoning.push(
      `Pichle saal (${monthDisplayLabel(lastYearMonth)}) target ${formatLakh(lastYearTarget!)} set tha (Vakro data kam hai).`,
    );
  } else if (basedOn === 'recent_average') {
    reasoning.push(
      `Pichle 3 mahine ka average Vakro ${formatLakh(recentThreeMonthAvgPaise!)} — is par base kiya.`,
    );
  } else {
    reasoning.push('Naya shop / kam data — market ke hisaab se ₹15 Lakh se start karo.');
  }

  if (festivals.length > 0) {
    const names = festivals.map((f) => f.nameGu).join(', ');
    reasoning.push(
      `${monthDisplayLabel(month)} me ${festivals.length} tyohar: ${names} — kirana sale badhti hai.`,
    );
    const high = festivals.filter((f) => festivalImpact(f) === 'high');
    if (high.length > 0) {
      reasoning.push('Bade tyohar (Navratri/Diwali etc.) par stock + mithai se 10–15% zyada sale possible.');
    }
  } else {
    reasoning.push('Is mahine koi bada tyohar list me nahi — normal market growth ~8% apply hua.');
  }

  reasoning.push(
    `Market + tyohar uplift ~${upliftPercent}% — suggested target ${formatLakh(suggestedTargetPaise)}.`,
  );

  if (suggestedTargetPaise > basePaise) {
    const diff = suggestedTargetPaise - basePaise;
    reasoning.push(`Pichle base se ${formatLakh(diff)} (${upliftPercent}%) badha kar target suggest kiya.`);
  }

  return {
    month,
    monthLabel: monthDisplayLabel(month),
    lastYearMonth,
    lastYearMonthLabel: monthDisplayLabel(lastYearMonth),
    lastYear:
      lastYearAchieved > 0 || lastYearTarget !== null
        ? { targetPaise: lastYearTarget, achievedPaise: lastYearAchieved }
        : null,
    recentThreeMonthAvgPaise,
    festivals: festivals.map((f) => ({
      date: f.date,
      nameHi: f.nameHi,
      nameGu: f.nameGu,
      impact: festivalImpact(f),
    })),
    suggestedTargetPaise,
    suggestedTargetRupees: paiseToRupees(suggestedTargetPaise),
    basePaise,
    upliftPercent,
    basedOn,
    reasoning,
  };
}
