import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { AddPurchaseDialog } from '@/components/purchases/AddPurchaseDialog';
import { RecordPaymentDialog } from '@/components/purchases/RecordPaymentDialog';
import { PayStoreDialog } from '@/components/purchases/PayStoreDialog';
import { DataImportExport } from '@/components/data/DataImportExport';
import { apiFetch, shopPath } from '@/lib/api';
import { useShopId } from '@/contexts/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  currentMonth,
  cn,
  formatInrFromPaise,
  monthStartEnd,
  startOfWeekIso,
  todayIso,
} from '@/lib/utils';
import type { DailyPurchase, PaymentStatus, PurchaseSourceSummary, PurchasesSummary } from '@turnover/shared';

type DatePreset = 'today' | 'week' | 'month' | 'all';
type ViewMode = 'by-store' | 'all-entries';
type PaymentFilter = 'all' | 'unpaid' | 'partial' | 'paid';

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'all', label: 'All' },
];

const PAYMENT_FILTERS: { id: PaymentFilter; label: string }[] = [
  { id: 'all', label: 'All bills' },
  { id: 'unpaid', label: 'Not paid' },
  { id: 'partial', label: 'Partial' },
  { id: 'paid', label: 'Paid' },
];

function presetRange(preset: DatePreset): { from?: string; to?: string } {
  const today = todayIso();
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'week') return { from: startOfWeekIso(), to: today };
  if (preset === 'month') return monthStartEnd(currentMonth());
  return {};
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === 'paid') return <Badge variant="success">Paid</Badge>;
  if (status === 'partial') return <Badge variant="secondary">Partial</Badge>;
  return <Badge variant="outline">Not paid</Badge>;
}

function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
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
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PurchasesPage() {
  const shopId = useShopId();
  const [preset, setPreset] = useState<DatePreset>('month');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [source, setSource] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('by-store');
  const [drillSource, setDrillSource] = useState<string | null>(null);
  const [payPurchase, setPayPurchase] = useState<DailyPurchase | null>(null);
  const [payStore, setPayStore] = useState<PurchaseSourceSummary | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const range = presetRange(preset);
  const effectiveSource = drillSource ?? (source === 'all' ? undefined : source);

  const queryParams = new URLSearchParams();
  if (range.from) queryParams.set('from', range.from);
  if (range.to) queryParams.set('to', range.to);
  if (effectiveSource) queryParams.set('source', effectiveSource);
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (paymentFilter !== 'all') queryParams.set('paymentStatus', paymentFilter);
  const qs = queryParams.toString();

  const { data: summary, isFetching: summaryFetching } = useQuery({
    queryKey: ['purchases-summary', shopId, qs],
    queryFn: () =>
      apiFetch<{ data: PurchasesSummary }>(shopPath(shopId, `/purchases/summary?${qs}`)).then(
        (r) => r.data,
      ),
    placeholderData: keepPreviousData,
  });

  const { data: listRes, isFetching: listFetching } = useQuery({
    queryKey: ['purchases', shopId, qs],
    queryFn: () =>
      apiFetch<{ data: DailyPurchase[] }>(shopPath(shopId, `/purchases?${qs}&limit=100`)),
    placeholderData: keepPreviousData,
  });

  const { data: sources } = useQuery({
    queryKey: ['purchase-sources', shopId],
    queryFn: () =>
      apiFetch<{ data: string[] }>(shopPath(shopId, '/purchases/sources')).then((r) => r.data),
    staleTime: 60_000,
  });

  const isRefreshing = summaryFetching || listFetching;
  const entries = listRes?.data ?? [];
  const storeRows = summary?.byStore ?? [];

  const entryColumns = useMemo<ColumnDef<DailyPurchase>[]>(
    () => [
      { accessorKey: 'date', header: 'Date' },
      { accessorKey: 'sourceName', header: 'Store' },
      {
        accessorKey: 'amountPaise',
        header: 'Total',
        cell: ({ getValue }) => formatInrFromPaise(getValue() as number),
      },
      {
        accessorKey: 'paidAmountPaise',
        header: 'Paid',
        cell: ({ getValue }) => formatInrFromPaise(getValue() as number),
      },
      {
        accessorKey: 'pendingPaise',
        header: 'Pending',
        cell: ({ row }) => (
          <span className={row.original.pendingPaise > 0 ? 'font-medium text-amber-700' : ''}>
            {formatInrFromPaise(row.original.pendingPaise)}
          </span>
        ),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as PaymentStatus} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setPayPurchase(row.original)}>
            {row.original.pendingPaise > 0 ? 'Pay' : 'Manage'}
          </Button>
        ),
      },
    ],
    [],
  );

  const storeColumns = useMemo<ColumnDef<PurchasesSummary['byStore'][number]>[]>(
    () => [
      { accessorKey: 'sourceName', header: 'Store' },
      {
        accessorKey: 'totalPaise',
        header: 'Purchased',
        cell: ({ getValue }) => formatInrFromPaise(getValue() as number),
      },
      {
        accessorKey: 'paidPaise',
        header: 'Paid',
        cell: ({ getValue }) => formatInrFromPaise(getValue() as number),
      },
      {
        accessorKey: 'pendingPaise',
        header: 'Pending',
        cell: ({ row }) => (
          <span className={row.original.pendingPaise > 0 ? 'font-semibold text-amber-700' : ''}>
            {formatInrFromPaise(row.original.pendingPaise)}
          </span>
        ),
      },
      { accessorKey: 'entryCount', header: 'Entries' },
      {
        id: 'storePay',
        header: '',
        cell: ({ row }) =>
          row.original.pendingPaise > 0 ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPayStore(row.original);
              }}
            >
              Pay now
            </Button>
          ) : null,
      },
    ],
    [],
  );

  const entryTable = useReactTable({ data: entries, columns: entryColumns, getCoreRowModel: getCoreRowModel() });
  const storeTable = useReactTable({
    data: storeRows,
    columns: storeColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Purchases</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Track purchases, payments & pending by store</p>
        </div>
        <div className="w-full sm:w-auto">
          <AddPurchaseDialog />
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-3 sm:gap-4',
          isRefreshing && 'opacity-80',
        )}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total purchased</CardTitle>
            <p className="text-2xl font-bold">{summary ? formatInrFromPaise(summary.totalPaise) : '—'}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total paid</CardTitle>
            <p className="text-2xl font-bold text-emerald-700">
              {summary ? formatInrFromPaise(summary.totalPaidPaise) : '—'}
            </p>
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total pending</CardTitle>
            <p className="text-2xl font-bold text-amber-800">
              {summary ? formatInrFromPaise(summary.totalPendingPaise) : '—'}
            </p>
          </CardHeader>
        </Card>
      </div>

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
          <Select
            value={drillSource ?? source}
            onValueChange={(v) => {
              setDrillSource(null);
              setSource(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stores</SelectItem>
              {(sources ?? []).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search store…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div
          role="group"
          aria-label="Payment status"
          className="grid h-auto w-full grid-cols-4 rounded-lg bg-muted p-1 sm:inline-flex sm:w-auto"
        >
          {PAYMENT_FILTERS.map(({ id, label }) => (
            <FilterChip key={id} active={paymentFilter === id} onClick={() => setPaymentFilter(id)}>
              {label}
            </FilterChip>
          ))}
        </div>
        {isRefreshing && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating purchases…
          </p>
        )}
      </div>

      {drillSource && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Store:</span>
          <strong>{drillSource}</strong>
          <button type="button" className="text-primary underline" onClick={() => setDrillSource(null)}>Clear</button>
        </div>
      )}

      <DataImportExport from={range.from} to={range.to} />

      <div className="space-y-4">
        <div
          role="group"
          aria-label="View mode"
          className="grid h-auto w-full grid-cols-2 rounded-lg bg-muted p-1 sm:inline-flex sm:w-auto"
        >
          <FilterChip active={viewMode === 'by-store'} onClick={() => setViewMode('by-store')}>
            By store
          </FilterChip>
          <FilterChip active={viewMode === 'all-entries'} onClick={() => setViewMode('all-entries')}>
            All entries
          </FilterChip>
        </div>

        {viewMode === 'by-store' ? (
          <>
            <p className="text-sm text-muted-foreground">
              Tap <strong>Pay now</strong> on any store to pay partial or full pending. Use <strong>All</strong> dates to include old bills.
            </p>
            <div className={cn('space-y-2 md:hidden transition-opacity', isRefreshing && 'opacity-80')}>
              {storeRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
              ) : (
                storeRows.map((store) => (
                  <Card key={store.sourceName} className="active:bg-muted/50">
                    <CardContent className="p-4">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setDrillSource(store.sourceName)}
                      >
                        <p className="font-semibold">{store.sourceName}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Purchased</p>
                            <p className="font-medium tabular-nums">{formatInrFromPaise(store.totalPaise)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pending</p>
                            <p className={cn('font-medium tabular-nums', store.pendingPaise > 0 && 'text-amber-700')}>
                              {formatInrFromPaise(store.pendingPaise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Paid</p>
                            <p className="font-medium tabular-nums text-emerald-700">{formatInrFromPaise(store.paidPaise)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Entries</p>
                            <p className="font-medium">{store.entryCount}</p>
                          </div>
                        </div>
                      </button>
                      {store.pendingPaise > 0 && (
                        <Button
                          className="mt-3 w-full"
                          size="sm"
                          onClick={() => setPayStore(store)}
                        >
                          Pay store now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <Card className={cn('hidden md:block transition-opacity', isRefreshing && 'opacity-80')}>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    {storeTable.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {storeTable.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No data</TableCell>
                      </TableRow>
                    ) : (
                      storeTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="cursor-pointer" onClick={() => setDrillSource(row.original.sourceName)}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className={cn('space-y-2 md:hidden transition-opacity', isRefreshing && 'opacity-80')}>
              {entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No entries</p>
              ) : (
                entries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{entry.sourceName}</p>
                          <p className="text-xs text-muted-foreground">{entry.date}</p>
                        </div>
                        <StatusBadge status={entry.paymentStatus} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium tabular-nums">{formatInrFromPaise(entry.amountPaise)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid</p>
                          <p className="font-medium tabular-nums">{formatInrFromPaise(entry.paidAmountPaise)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending</p>
                          <p className={cn('font-medium tabular-nums', entry.pendingPaise > 0 && 'text-amber-700')}>
                            {formatInrFromPaise(entry.pendingPaise)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full"
                        onClick={() => setPayPurchase(entry)}
                      >
                        {entry.pendingPaise > 0 ? 'Record payment' : 'Manage payment'}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <Card className={cn('hidden md:block transition-opacity', isRefreshing && 'opacity-80')}>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    {entryTable.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {entryTable.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">No entries</TableCell>
                      </TableRow>
                    ) : (
                      entryTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {payStore && (
        <PayStoreDialog
          store={payStore}
          open={!!payStore}
          onOpenChange={(open) => !open && setPayStore(null)}
        />
      )}

      {payPurchase && (
        <RecordPaymentDialog
          purchase={payPurchase}
          open={!!payPurchase}
          onOpenChange={(open) => !open && setPayPurchase(null)}
        />
      )}
    </div>
  );
}
