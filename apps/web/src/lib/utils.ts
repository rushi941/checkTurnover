import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export {
  APP_TIMEZONE,
  APP_TIMEZONE_LABEL,
  addDaysIso,
  currentMonth,
  formatDateInKolkata,
  formatDateTimeInKolkata,
  formatTimeInKolkata,
  isDateNotFuture,
  isValidIsoDate,
  isoDateInTimeZone,
  kolkataWeekday,
  monthEnd,
  monthLabel,
  monthStart,
  monthStartEnd,
  shiftMonth,
  startOfWeekIso,
  todayIso,
  toBusinessDateIso,
} from '@turnover/shared';

export {
  DEFAULT_PROFIT_MARGIN_PERCENT,
  netProfitPaise,
  profitFromVakroAfterKharcho,
  profitFromVakroPaise,
} from '@turnover/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function formatLakh(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(2)} Lakh`;
  return formatInrFromPaise(paise);
}
