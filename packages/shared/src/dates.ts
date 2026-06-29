/** Indian Standard Time — used for all business dates (today, month, week). */
export const APP_TIMEZONE = 'Asia/Kolkata';

export const APP_TIMEZONE_LABEL = 'Kolkata (IST)';

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function isoDateFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** YYYY-MM-DD in a given IANA timezone (en-CA locale gives ISO-shaped output). */
export function isoDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Today's calendar date in Kolkata. */
export function todayIso(): string {
  return isoDateInTimeZone(new Date(), APP_TIMEZONE);
}

/** Current month YYYY-MM in Kolkata. */
export function currentMonth(): string {
  return todayIso().slice(0, 7);
}

export function kolkataWeekday(date = new Date()): number {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
  }).format(date);
  return WEEKDAY[part] ?? 0;
}

export function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + delta, 12, 0, 0));
  return isoDateFromParts(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/** Monday of the current week in Kolkata. */
export function startOfWeekIso(): string {
  const today = todayIso();
  const dow = kolkataWeekday();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return addDaysIso(today, mondayOffset);
}

export function monthStart(month: string): string {
  return `${month}-01`;
}

export function monthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0, 12, 0, 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, '0')}`;
}

export function monthStartEnd(month: string): { from: string; to: string } {
  return { from: monthStart(month), to: monthEnd(month) };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1, 12, 0, 0));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isDateNotFuture(date: string): boolean {
  return date <= todayIso();
}

/** Normalize DB / API date values to YYYY-MM-DD in Kolkata. */
export function toBusinessDateIso(value: string | Date): string {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    return isoDateInTimeZone(new Date(value), APP_TIMEZONE);
  }
  return isoDateInTimeZone(value, APP_TIMEZONE);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, 1, 12, 0, 0)));
}

export function formatDateTimeInKolkata(date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDateInKolkata(date: string | Date): string {
  const iso = typeof date === 'string' ? date.slice(0, 10) : toBusinessDateIso(date);
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
}

export function formatTimeInKolkata(date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}
