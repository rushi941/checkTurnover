import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DayPanchangDetail } from '@/components/calendar/DayPanchangDetail';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import {
  cn,
  currentMonth,
  formatDateInKolkata,
  formatInrFromPaise,
  monthLabel,
  shiftMonth,
  todayIso,
} from '@/lib/utils';
import type { CalendarDay, CalendarMonth } from '@turnover/shared';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarPage() {
  const shopId = useShopId();
  const [month, setMonth] = useState(currentMonth());
  const [selectedDate, setSelectedDate] = useState(todayIso());

  function changeMonth(next: string) {
    setMonth(next);
    if (!next.startsWith(selectedDate.slice(0, 7))) {
      setSelectedDate(`${next}-01`);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', shopId, month],
    queryFn: () =>
      apiFetch<{ data: CalendarMonth }>(shopPath(shopId, `/calendar?month=${month}`)).then(
        (r) => r.data,
      ),
  });

  const grid = useMemo(() => {
    if (!data) return [];
    const [y, m] = month.split('-').map(Number);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const cells: (CalendarDay | null)[] = Array(offset).fill(null);
    return [...cells, ...data.days];
  }, [data, month]);

  const selectedDay = data?.days.find((d) => d.date === selectedDate) ?? null;
  const monthTitle = monthLabel(month);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 sm:text-2xl">
            <CalendarDays className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Tithi, Choghadiya, tyohar + daily Vakro · Ahmedabad (IST)
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => changeMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex-1 text-center text-sm font-medium sm:min-w-[140px] sm:flex-none sm:text-base">{monthTitle}</span>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => changeMonth(shiftMonth(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading calendar…</p>
      ) : (
        <>
          {selectedDay && (
            <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/40 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{formatDateInKolkata(selectedDay.date)}</CardTitle>
                <CardDescription>Tithi & Choghadiya detail</CardDescription>
              </CardHeader>
              <CardContent>
                <DayPanchangDetail day={selectedDay} />
              </CardContent>
            </Card>
          )}

          <div className="space-y-2 md:hidden">
            {data?.days.map((day) => (
              <Card
                key={day.date}
                className={cn(
                  'cursor-pointer transition-colors',
                  day.festival && 'border-amber-300 bg-amber-50/40',
                  selectedDate === day.date && 'ring-2 ring-indigo-400',
                )}
                onClick={() => setSelectedDate(day.date)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {parseInt(day.date.slice(8), 10)}{' '}
                        <span className="text-sm font-normal text-muted-foreground">
                          {formatDateInKolkata(day.date).split(',')[0]}
                        </span>
                      </p>
                      {day.tithi && (
                        <p className="mt-1 text-sm font-medium text-indigo-900">{day.tithi.nameGu}</p>
                      )}
                      {day.nakshatra && (
                        <p className="text-xs text-muted-foreground">{day.nakshatra}</p>
                      )}
                      {day.festival && (
                        <p className="mt-1 text-sm text-amber-900">
                          {day.festival.nameGu}
                          <span className="text-muted-foreground"> · {day.festival.nameHi}</span>
                        </p>
                      )}
                    </div>
                    {day.kamaiPaise !== null ? (
                      <p className="shrink-0 text-sm font-semibold text-emerald-800 tabular-nums">
                        {formatInrFromPaise(day.kamaiPaise)}
                      </p>
                    ) : (
                      <span className="shrink-0 text-xs text-muted-foreground">No Vakro</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden md:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Month view</CardTitle>
              <CardDescription>
                Click a day for full Choghadiya ·{' '}
                <span className="text-indigo-700">Tithi</span> ·{' '}
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Tyohar
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {WEEKDAYS.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {grid.map((day, i) =>
                  day ? (
                    <button
                      type="button"
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        'min-h-[96px] rounded-lg border p-1.5 text-left text-xs transition-colors',
                        day.festival && 'border-amber-300 bg-amber-50/60',
                        day.kamaiPaise !== null && 'ring-1 ring-emerald-200',
                        selectedDate === day.date && 'ring-2 ring-indigo-500',
                        'hover:bg-muted/40',
                      )}
                    >
                      <div className="font-semibold">{parseInt(day.date.slice(8), 10)}</div>
                      {day.tithi && (
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight font-medium text-indigo-900">
                          {day.tithi.nameGu}
                        </p>
                      )}
                      {day.festival && (
                        <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-amber-900" title={day.festival.nameHi}>
                          {day.festival.nameGu}
                        </p>
                      )}
                      {day.kamaiPaise !== null && (
                        <p className="mt-1 font-medium text-emerald-800 tabular-nums">
                          {formatInrFromPaise(day.kamaiPaise)}
                        </p>
                      )}
                    </button>
                  ) : (
                    <div key={`empty-${i}`} className="min-h-[96px]" />
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {data && data.festivals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tyohar this month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.festivals.map((f) => (
                  <div key={f.date} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-medium">{f.nameGu}</p>
                      <p className="text-sm text-muted-foreground">{f.nameHi}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{f.date}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
