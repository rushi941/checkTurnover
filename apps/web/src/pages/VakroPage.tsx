import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ChevronRight,
  Loader2,
  Minus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageLoader } from '@/components/ui/loader';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import {
  cn,
  currentMonth,
  formatDateInKolkata,
  formatInrFromPaise,
  isDateNotFuture,
  isValidIsoDate,
  monthStartEnd,
  profitFromVakroPaise,
  todayIso,
  DEFAULT_PROFIT_MARGIN_PERCENT,
} from '@/lib/utils';
import type { VakroDayDetail, VakroDayRow } from '@turnover/shared';

function validateVakroForm(date: string, amount: string): string | null {
  if (!date) return 'Please select a date';
  if (!isValidIsoDate(date)) return 'Invalid date';
  if (!isDateNotFuture(date)) return 'Date cannot be in the future';
  if (!amount.trim()) return 'Vakro amount is required';
  const n = parseFloat(amount);
  if (!Number.isFinite(n) || n < 0) return 'Amount must be 0 or greater';
  return null;
}

function formatRowDate(iso: string): string {
  return formatDateInKolkata(iso).split(',')[0] ?? iso;
}

function AmountCell({
  paise,
  variant = 'default',
  prefix,
  empty = '—',
}: {
  paise: number | null | undefined;
  variant?: 'default' | 'in' | 'out' | 'net';
  prefix?: string;
  empty?: string;
}) {
  if (paise == null) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  return (
    <span
      className={cn(
        'tabular-nums font-medium',
        variant === 'in' && 'text-emerald-700',
        variant === 'out' && 'text-rose-700',
        variant === 'net' && (paise >= 0 ? 'text-emerald-800 font-semibold' : 'text-destructive font-semibold'),
      )}
    >
      {prefix}
      {formatInrFromPaise(paise)}
    </span>
  );
}

export function VakroPage() {
  const shopId = useShopId();
  const qc = useQueryClient();
  const month = currentMonth();
  const { from, to } = monthStartEnd(month);

  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: dayDetail, isFetching: detailFetching } = useQuery({
    queryKey: ['vakro-detail', shopId, date],
    queryFn: () =>
      apiFetch<{ data: VakroDayDetail }>(shopPath(shopId, `/vakro/detail?date=${date}`)).then(
        (r) => r.data,
      ),
    enabled: isValidIsoDate(date),
    placeholderData: keepPreviousData,
  });

  const { data: list, isLoading: listLoading, isFetching: listFetching } = useQuery({
    queryKey: ['vakro-list', shopId, from, to],
    queryFn: () =>
      apiFetch<{ data: VakroDayRow[] }>(
        shopPath(shopId, `/vakro/list?from=${from}&to=${to}`),
      ).then((r) => r.data),
  });

  const monthTotals = useMemo(() => {
    const rows = list ?? [];
    return rows.reduce(
      (acc, row) => ({
        vakroPaise: acc.vakroPaise + (row.vakroPaise ?? 0),
        supplierPaidPaise: acc.supplierPaidPaise + row.supplierPaidPaise,
        kharchoPaise: acc.kharchoPaise + row.kharchoPaise,
        netCashPaise: acc.netCashPaise + (row.netCashPaise ?? 0),
        daysWithVakro: acc.daysWithVakro + (row.vakroEntered ? 1 : 0),
      }),
      {
        vakroPaise: 0,
        supplierPaidPaise: 0,
        kharchoPaise: 0,
        netCashPaise: 0,
        daysWithVakro: 0,
      },
    );
  }, [list]);

  useEffect(() => {
    setAmount('');
    setNote('');
    setFormError(null);
  }, [date]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(shopPath(shopId, '/vakro'), {
        method: 'PUT',
        body: JSON.stringify({
          amount: parseFloat(amount),
          date,
          note: note || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Vakro saved');
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['vakro-detail'] });
      qc.invalidateQueries({ queryKey: ['vakro-list'] });
      qc.invalidateQueries({ queryKey: ['monthly-report'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['ai-turnover'] });
      setFormError(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function loadExisting() {
    if (dayDetail?.vakro) {
      setAmount(String(dayDetail.vakro.amountPaise / 100));
      setNote(dayDetail.vakro.note ?? '');
      setFormError(null);
    }
  }

  function handleSave() {
    const err = validateVakroForm(date, amount);
    if (err) {
      setFormError(err);
      return;
    }
    mutation.mutate();
  }

  const isToday = date === todayIso();
  const existing = dayDetail?.vakro ?? null;
  const amountNum = parseFloat(amount);
  const previewVakroPaise =
    Number.isFinite(amountNum) && amount.trim() ? Math.round(amountNum * 100) : null;
  const previewNetPaise =
    previewVakroPaise !== null && dayDetail
      ? previewVakroPaise - dayDetail.supplierPaidPaise - dayDetail.kharchoPaise
      : (dayDetail?.netCashPaise ?? null);
  const estimatedProfitPaise =
    previewVakroPaise !== null ? profitFromVakroPaise(previewVakroPaise) : null;
  const isRefreshing = listFetching || detailFetching;

  if (listLoading && !list) {
    return <PageLoader label="Loading Vakro…" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <Wallet className="h-6 w-6 text-emerald-600" />
            Vakro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Daily sales total — supplier payments & kharcho auto-deduct from cash in hand
          </p>
        </div>
        <Badge variant="secondary" className="w-fit shrink-0 tabular-nums">
          {month}
        </Badge>
      </div>

      <div
        className={cn(
          'grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-4 lg:gap-4',
          isRefreshing && 'opacity-80',
        )}
      >
        <Card className="border-emerald-200/80 bg-emerald-50/40 shadow-sm">
          <CardHeader className="space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Vakro
            </CardTitle>
            <p className="text-xl font-bold tabular-nums text-emerald-900 sm:text-2xl">
              {formatInrFromPaise(monthTotals.vakroPaise)}
            </p>
            <p className="text-xs text-muted-foreground">{monthTotals.daysWithVakro} days entered</p>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Supplier paid
            </CardTitle>
            <p className="text-xl font-bold tabular-nums text-rose-800 sm:text-2xl">
              {formatInrFromPaise(monthTotals.supplierPaidPaise)}
            </p>
            <p className="text-xs text-muted-foreground">Payments on bill dates</p>
          </CardHeader>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Kharcho
            </CardTitle>
            <p className="text-xl font-bold tabular-nums text-rose-800 sm:text-2xl">
              {formatInrFromPaise(monthTotals.kharchoPaise)}
            </p>
            <p className="text-xs text-muted-foreground">Daily expenses</p>
          </CardHeader>
        </Card>
        <Card
          className={cn(
            'col-span-2 shadow-sm lg:col-span-1',
            monthTotals.netCashPaise >= 0
              ? 'border-emerald-200/80 bg-emerald-50/30'
              : 'border-destructive/30 bg-destructive/5',
          )}
        >
          <CardHeader className="space-y-0 pb-2 pt-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Net cash
            </CardTitle>
            <p
              className={cn(
                'text-xl font-bold tabular-nums sm:text-2xl',
                monthTotals.netCashPaise >= 0 ? 'text-emerald-900' : 'text-destructive',
              )}
            >
              {formatInrFromPaise(monthTotals.netCashPaise)}
            </p>
            <p className="text-xs text-muted-foreground">Vakro − paid − kharcho</p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{existing ? 'Update Vakro' : 'Enter Vakro'}</CardTitle>
            <CardDescription>One total for the entire day&apos;s sales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="vakro-date">Date</Label>
              <Input
                id="vakro-date"
                type="date"
                value={date}
                max={todayIso()}
                onChange={(e) => setDate(e.target.value)}
              />
              {!isToday && (
                <p className="text-xs text-muted-foreground">Entering for a past date</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vakro">Vakro amount (₹)</Label>
              <Input
                id="vakro"
                type="number"
                min="0"
                step="0.01"
                placeholder="15800"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFormError(null);
                }}
                className="text-lg tabular-nums"
              />
              {dayDetail && (dayDetail.supplierPaidPaise > 0 || dayDetail.kharchoPaise > 0) && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Minus className="h-3.5 w-3.5" />
                    Auto deduction
                  </p>
                  <div className="space-y-1.5">
                    {dayDetail.supplierPaidPaise > 0 && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Supplier paid</span>
                        <span className="tabular-nums text-rose-700">
                          − {formatInrFromPaise(dayDetail.supplierPaidPaise)}
                        </span>
                      </div>
                    )}
                    {dayDetail.kharchoPaise > 0 && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Kharcho</span>
                        <span className="tabular-nums text-rose-700">
                          − {formatInrFromPaise(dayDetail.kharchoPaise)}
                        </span>
                      </div>
                    )}
                    {previewNetPaise !== null && amount.trim() && (
                      <div className="flex justify-between gap-2 border-t pt-2 font-semibold text-emerald-800">
                        <span>Net cash</span>
                        <span className="tabular-nums">{formatInrFromPaise(previewNetPaise)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {estimatedProfitPaise !== null && amount.trim() && (
                <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  Est. profit ({DEFAULT_PROFIT_MARGIN_PERCENT}%):{' '}
                  <strong className="tabular-nums">{formatInrFromPaise(estimatedProfitPaise)}</strong>
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vakro-note">Note (optional)</Label>
              <Input id="vakro-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSave}
              disabled={mutation.isPending || detailFetching}
            >
              {mutation.isPending ? 'Saving…' : 'Save Vakro'}
            </Button>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'lg:col-span-3 shadow-sm',
            existing && 'border-emerald-200/80 bg-emerald-50/20',
          )}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Selected day</CardTitle>
              <CardDescription>{formatDateInKolkata(date)}</CardDescription>
            </div>
            {existing ? (
              <Badge variant="success">Vakro entered</Badge>
            ) : (
              <Badge variant="outline">No Vakro yet</Badge>
            )}
          </CardHeader>
          <CardContent>
            {detailFetching && !dayDetail ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading day…
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Vakro
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                    {existing ? formatInrFromPaise(existing.amountPaise) : '—'}
                  </p>
                  {existing?.note && (
                    <p className="mt-2 text-sm text-muted-foreground">{existing.note}</p>
                  )}
                  {existing && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={loadExisting}>
                      Load to edit
                    </Button>
                  )}
                </div>
                <div className="rounded-lg border bg-background p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Deductions
                  </p>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        Supplier paid
                      </span>
                      <span className="tabular-nums font-medium text-rose-700">
                        {dayDetail && dayDetail.supplierPaidPaise > 0
                          ? `− ${formatInrFromPaise(dayDetail.supplierPaidPaise)}`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                        Kharcho
                      </span>
                      <span className="tabular-nums font-medium text-rose-700">
                        {dayDetail && dayDetail.kharchoPaise > 0
                          ? `− ${formatInrFromPaise(dayDetail.kharchoPaise)}`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    'rounded-lg border p-4 shadow-sm sm:col-span-2',
                    (dayDetail?.netCashPaise ?? 0) >= 0
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-destructive/30 bg-destructive/5',
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Net cash in hand
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-3xl font-bold tabular-nums tracking-tight',
                      dayDetail?.netCashPaise != null && dayDetail.netCashPaise >= 0
                        ? 'text-emerald-900'
                        : 'text-destructive',
                    )}
                  >
                    {dayDetail?.netCashPaise != null
                      ? formatInrFromPaise(dayDetail.netCashPaise)
                      : '—'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Date-wise ledger</h2>
            <p className="text-sm text-muted-foreground">
              Tap a row to open that day — Vakro minus payments & kharcho
            </p>
          </div>
          {isRefreshing && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </p>
          )}
        </div>

        {(list ?? []).length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No activity this month yet.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className={cn('space-y-2 md:hidden', isRefreshing && 'opacity-80')}>
              {(list ?? []).map((row) => {
                const selected = row.date === date;
                return (
                  <Card
                    key={row.date}
                    className={cn(
                      'cursor-pointer shadow-sm transition-colors active:bg-muted/40',
                      selected && 'ring-2 ring-emerald-400/60',
                    )}
                    onClick={() => setDate(row.date)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{formatRowDate(row.date)}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{row.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {row.vakroEntered ? (
                            <Badge variant="success" className="text-[10px]">
                              Entered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Pending
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Vakro</p>
                          <AmountCell paise={row.vakroPaise} variant="in" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid out</p>
                          <AmountCell
                            paise={row.supplierPaidPaise + row.kharchoPaise}
                            variant="out"
                            empty="—"
                          />
                        </div>
                        <div className="col-span-2 flex items-end justify-between gap-2 border-t pt-2">
                          <p className="text-xs font-medium text-muted-foreground">Net cash</p>
                          <AmountCell paise={row.netCashPaise} variant="net" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className={cn('hidden overflow-hidden shadow-sm md:block', isRefreshing && 'opacity-80')}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[140px]">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Vakro</TableHead>
                      <TableHead className="text-right">Supplier paid</TableHead>
                      <TableHead className="text-right">Kharcho</TableHead>
                      <TableHead className="text-right">Net cash</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(list ?? []).map((row) => {
                      const selected = row.date === date;
                      return (
                        <TableRow
                          key={row.date}
                          className={cn(
                            'cursor-pointer',
                            selected && 'bg-emerald-50/80 hover:bg-emerald-50/80',
                          )}
                          onClick={() => setDate(row.date)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatRowDate(row.date)}</p>
                              <p className="text-xs text-muted-foreground tabular-nums">{row.date}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {row.vakroEntered ? (
                              <Badge variant="success">Entered</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountCell paise={row.vakroPaise} variant="in" />
                          </TableCell>
                          <TableCell className="text-right">
                            {row.supplierPaidPaise > 0 ? (
                              <AmountCell paise={row.supplierPaidPaise} variant="out" prefix="− " />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.kharchoPaise > 0 ? (
                              <AmountCell paise={row.kharchoPaise} variant="out" prefix="− " />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountCell paise={row.netCashPaise} variant="net" />
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={2} className="font-semibold">
                        Month total
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-emerald-800">
                        {formatInrFromPaise(monthTotals.vakroPaise)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-rose-800">
                        {monthTotals.supplierPaidPaise > 0
                          ? `− ${formatInrFromPaise(monthTotals.supplierPaidPaise)}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-rose-800">
                        {monthTotals.kharchoPaise > 0
                          ? `− ${formatInrFromPaise(monthTotals.kharchoPaise)}`
                          : '—'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-bold tabular-nums',
                          monthTotals.netCashPaise >= 0 ? 'text-emerald-900' : 'text-destructive',
                        )}
                      >
                        {formatInrFromPaise(monthTotals.netCashPaise)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
