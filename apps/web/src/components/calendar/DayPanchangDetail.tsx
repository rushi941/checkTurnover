import { cn } from '@/lib/utils';
import type { CalendarDay, ChoghadiyaQuality } from '@turnover/shared';

function qualityClass(q: ChoghadiyaQuality): string {
  if (q === 'shubh') return 'border-emerald-200 bg-emerald-50/80 text-emerald-900';
  if (q === 'ashubh') return 'border-rose-200 bg-rose-50/80 text-rose-900';
  return 'border-slate-200 bg-slate-50/80 text-slate-800';
}

function qualityBadge(q: ChoghadiyaQuality): string {
  if (q === 'shubh') return 'શુભ';
  if (q === 'ashubh') return 'અશુભ';
  return 'સામાન્ય';
}

function ChoghadiyaTable({
  title,
  slots,
}: {
  title: string;
  slots: NonNullable<CalendarDay['choghadiya']>['day'];
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {slots.map((slot, i) => (
          <div
            key={`${slot.name}-${i}`}
            className={cn('rounded-lg border px-2.5 py-2 text-xs', qualityClass(slot.quality))}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{slot.nameGu}</span>
              <span className="text-[10px] opacity-80">{qualityBadge(slot.quality)}</span>
            </div>
            <p className="mt-0.5 text-[10px] opacity-90">{slot.name}</p>
            <p className="mt-1 tabular-nums">
              {slot.start} – {slot.end}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayPanchangDetail({ day }: { day: CalendarDay }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        {day.tithi && (
          <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-medium text-indigo-900">
            {day.tithi.nameGu}
          </span>
        )}
        {day.tithis.length > 1 && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-800">
            → {day.tithis[day.tithis.length - 1].nameGu}
          </span>
        )}
        {day.nakshatra && (
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-900">
            {day.nakshatra}
          </span>
        )}
        {day.varaHi && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-800">{day.varaHi}</span>
        )}
      </div>

      {(day.sunrise || day.sunset) && (
        <p className="text-xs text-muted-foreground">
          {day.sunrise && <>સૂર્યોદય {day.sunrise}</>}
          {day.sunrise && day.sunset && ' · '}
          {day.sunset && <>સૂર્યાસ્ત {day.sunset}</>}
        </p>
      )}

      {day.choghadiya ? (
        <div className="space-y-4">
          <ChoghadiyaTable title="દિવસ ચોઘડિયા (Day)" slots={day.choghadiya.day} />
          <ChoghadiyaTable title="રાત ચોઘડિયા (Night)" slots={day.choghadiya.night} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Choghadiya not available for this date.</p>
      )}
    </div>
  );
}
