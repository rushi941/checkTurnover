import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddKharchoDialog } from '@/components/kharcho/AddKharchoDialog';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import {
  cn,
  currentMonth,
  formatInrFromPaise,
  monthStartEnd,
  startOfWeekIso,
  todayIso,
} from '@/lib/utils';
import { KHARCHO_CATEGORIES, type KharchoSummary, type ShopKharcho } from '@turnover/shared';

type DatePreset = 'today' | 'week' | 'month' | 'all';

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All' },
];

function presetRange(preset: DatePreset): { from?: string; to?: string } {
  const today = todayIso();
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'week') return { from: startOfWeekIso(), to: today };
  if (preset === 'month') return monthStartEnd(currentMonth());
  return {};
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm',
        active
          ? 'bg-background text-foreground shadow'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function KharchoPage() {
  const shopId = useShopId();
  const qc = useQueryClient();
  const [preset, setPreset] = useState<DatePreset>('month');
  const [category, setCategory] = useState<string>('all');
  const [editEntry, setEditEntry] = useState<ShopKharcho | null>(null);

  const range = presetRange(preset);
  const queryParams = new URLSearchParams();
  if (range.from) queryParams.set('from', range.from);
  if (range.to) queryParams.set('to', range.to);
  if (category !== 'all') queryParams.set('category', category);
  const qs = queryParams.toString();

  const { data: summary, isFetching: summaryFetching } = useQuery({
    queryKey: ['kharcho-summary', shopId, qs],
    queryFn: () =>
      apiFetch<{ data: KharchoSummary }>(shopPath(shopId, `/kharcho/summary?${qs}`)).then(
        (r) => r.data,
      ),
    placeholderData: keepPreviousData,
  });

  const { data: listRes, isFetching: listFetching } = useQuery({
    queryKey: ['kharcho', shopId, qs],
    queryFn: () =>
      apiFetch<{ data: ShopKharcho[] }>(shopPath(shopId, `/kharcho?${qs}&limit=200`)),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(shopPath(shopId, `/kharcho/${id}`), { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Kharcho deleted');
      qc.invalidateQueries({ queryKey: ['kharcho'] });
      qc.invalidateQueries({ queryKey: ['kharcho-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['monthly-report'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const entries = listRes?.data ?? [];
  const isRefreshing = summaryFetching || listFetching;

  const categoryTotals = useMemo(() => {
    const map = new Map(summary?.byCategory.map((c) => [c.category, c]) ?? []);
    return KHARCHO_CATEGORIES.map((c) => ({
      ...c,
      totalPaise: map.get(c.id)?.totalPaise ?? 0,
      entryCount: map.get(c.id)?.entryCount ?? 0,
    })).filter((c) => c.totalPaise > 0 || category === c.id);
  }, [summary, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 sm:text-2xl">
            <Receipt className="h-6 w-6 text-rose-600" />
            Kharcho (Expenses)
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Bhadu, salary, bills, maintenance, car, EMI — shop running costs
          </p>
        </div>
        <AddKharchoDialog />
      </div>

      <Card className={cn('border-rose-200 bg-rose-50/30', isRefreshing && 'opacity-80')}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total kharcho</CardTitle>
          <p className="text-2xl font-bold text-rose-900 tabular-nums">
            {summary ? formatInrFromPaise(summary.totalPaise) : '—'}
          </p>
          {summary && summary.entryCount > 0 && (
            <p className="text-xs text-muted-foreground">{summary.entryCount} entries</p>
          )}
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            role="group"
            aria-label="Date range"
            className="grid h-auto w-full grid-cols-4 rounded-lg bg-muted p-1 sm:inline-flex sm:w-auto"
          >
            {DATE_PRESETS.map(({ id, label }) => (
              <FilterChip key={id} active={preset === id} onClick={() => setPreset(id)}>
                {label}
              </FilterChip>
            ))}
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {KHARCHO_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.labelGu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isRefreshing && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating…
          </p>
        )}
      </div>

      {categoryTotals.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {categoryTotals.map((c) => (
            <Card
              key={c.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-muted/40',
                category === c.id && 'ring-2 ring-rose-300',
              )}
              onClick={() => setCategory(category === c.id ? 'all' : c.id)}
            >
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground">{c.labelGu}</p>
                <p className="text-lg font-bold tabular-nums">{formatInrFromPaise(c.totalPaise)}</p>
                {c.entryCount > 0 && (
                  <p className="text-xs text-muted-foreground">{c.entryCount} entries</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className={cn('space-y-2 md:hidden', isRefreshing && 'opacity-80')}>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No kharcho entries</p>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary" className="text-xs">
                      {entry.categoryLabel}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.date}</p>
                    {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
                  </div>
                  <p className="font-semibold tabular-nums text-rose-800">
                    {formatInrFromPaise(entry.amountPaise)}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditEntry(entry)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(entry.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className={cn('hidden md:block', isRefreshing && 'opacity-80')}>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No kharcho entries
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.categoryLabel}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.note ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-rose-800">
                      {formatInrFromPaise(entry.amountPaise)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditEntry(entry)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(entry.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editEntry && (
        <AddKharchoDialog
          editEntry={editEntry}
          open={!!editEntry}
          onOpenChange={(open) => !open && setEditEntry(null)}
        />
      )}
    </div>
  );
}
