import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import {
  APP_TIMEZONE,
  APP_TIMEZONE_LABEL,
  formatDateTimeInKolkata,
  isoDateInTimeZone,
  monthLabel,
} from '@/lib/utils';

export function KolkataDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const today = isoDateInTimeZone(now, APP_TIMEZONE);
  const month = today.slice(0, 7);

  return (
    <div
      className="border-b bg-slate-50/90 px-3 py-1.5 text-xs text-muted-foreground sm:px-6 sm:text-sm"
      title={`All dates use ${APP_TIMEZONE_LABEL}`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
          <Clock className="h-3.5 w-3.5 shrink-0 text-sky-600" />
          {formatDateTimeInKolkata(now)}
        </span>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <span>
          Today: <strong className="text-foreground">{today}</strong>
        </span>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <span className="hidden sm:inline">
          Month: <strong className="text-foreground">{monthLabel(month)}</strong>
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-sky-700/80 sm:text-xs">
          {APP_TIMEZONE_LABEL}
        </span>
      </div>
    </div>
  );
}
