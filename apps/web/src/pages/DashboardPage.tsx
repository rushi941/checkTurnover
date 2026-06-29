import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShoppingCart, Wallet, TrendingUp, Clock, Truck, Receipt, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCardPaise } from '@/components/dashboard/StatCard';
import { MonthlyTargetCard } from '@/components/dashboard/MonthlyTargetCard';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { AddPurchaseDialog } from '@/components/purchases/AddPurchaseDialog';
import { AddKharchoDialog } from '@/components/kharcho/AddKharchoDialog';
import { PageLoader } from '@/components/ui/loader';
import { apiFetch, shopPath } from '@/lib/api';
import { useAuth, useShopId } from '@/contexts/AuthContext';
import { useMonthlyTarget } from '@/hooks/useMonthlyTarget';
import { buildDailySummaryMessage, openWhatsAppShare } from '@/lib/whatsapp';
import { currentMonth, formatInrFromPaise, monthStartEnd, todayIso } from '@/lib/utils';
import type { DashboardData, PaymentStatus, PurchasesSummary } from '@turnover/shared';

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === 'paid') return <Badge variant="success">Paid</Badge>;
  if (status === 'partial') return <Badge variant="secondary">Partial</Badge>;
  return <Badge variant="outline">Not paid</Badge>;
}

export function DashboardPage() {
  const shopId = useShopId();
  const { shop } = useAuth();
  const date = todayIso();
  const month = currentMonth();
  const { from, to } = monthStartEnd(month);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', shopId, date],
    queryFn: () =>
      apiFetch<{ data: DashboardData }>(shopPath(shopId, `/dashboard?date=${date}`)).then(
        (r) => r.data,
      ),
    placeholderData: keepPreviousData,
  });

  const { data: monthSummary } = useQuery({
    queryKey: ['purchases-summary', shopId, 'month', from, to],
    queryFn: () =>
      apiFetch<{ data: PurchasesSummary }>(
        shopPath(shopId, `/purchases/summary?from=${from}&to=${to}`),
      ).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const { data: targetProgress } = useMonthlyTarget(month);

  if (isLoading && !data) {
    return <PageLoader label="Loading dashboard…" />;
  }

  if (isError || !data) {
    return <div className="text-sm text-destructive">Could not load dashboard.</div>;
  }

  const d = data;

  function shareWhatsApp() {
    const text = buildDailySummaryMessage(shop?.name ?? 'My shop', date, d);
    openWhatsAppShare(text, shop?.phone ?? undefined);
    toast.success('Opening WhatsApp…');
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground">Today · {date}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={shareWhatsApp}>
            <Share2 className="h-4 w-4" />
            Share on WhatsApp
          </Button>
          <AddPurchaseDialog defaultDate={date} />
          <AddKharchoDialog defaultDate={date} />
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link to="/vakro">{d.vakroEntered ? 'Edit Vakro' : 'Enter Vakro'}</Link>
          </Button>
        </div>
      </div>

      <OnboardingChecklist
        shopId={shopId}
        dashboard={d}
        hasMonthlyTarget={(targetProgress?.targetPaise ?? 0) > 0}
      />

      <MonthlyTargetCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardPaise title="Purchases today" paise={d.totalPurchasesPaise} icon={ShoppingCart} />
        <StatCardPaise title="Kharcho today" paise={d.totalKharchoPaise} icon={Receipt} variant="warning" />
        <StatCardPaise title="Pending to pay today" paise={d.totalPendingPaise} icon={Clock} variant="warning" />
        <StatCardPaise
          title="Vakro today"
          paise={d.vakroPaise}
          subtitle={d.vakroEntered ? 'Entered' : 'Not entered yet'}
          icon={Wallet}
          variant={d.vakroEntered ? 'default' : 'warning'}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCardPaise
          title="Profit today"
          paise={d.profitPaise}
          subtitle={`${d.profitMarginPercent}% of Vakro`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCardPaise
          title="Net profit today"
          paise={d.netProfitPaise}
          subtitle={`${d.profitMarginPercent}% Vakro − kharcho`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCardPaise
          title="Supplier pending (month)"
          paise={monthSummary?.totalPendingPaise ?? 0}
          subtitle={`${monthSummary?.sourceCount ?? 0} stores · this month`}
          icon={Truck}
          variant="warning"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCardPaise
          title="Purchased this month"
          paise={monthSummary?.totalPaise ?? 0}
          icon={ShoppingCart}
        />
        <StatCardPaise
          title="Paid to suppliers (month)"
          paise={monthSummary?.totalPaidPaise ?? 0}
          icon={Truck}
          variant="success"
        />
      </div>

      {d.kharchoRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s kharcho</CardTitle>
            <CardDescription>Shop running expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {d.kharchoRows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <span className="font-medium">{row.categoryLabel}</span>
                    {row.note && <p className="text-xs text-muted-foreground">{row.note}</p>}
                  </div>
                  <p className="tabular-nums font-medium text-rose-800">
                    {formatInrFromPaise(row.amountPaise)}
                  </p>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-4 w-full sm:w-auto" asChild>
              <Link to="/kharcho">View all kharcho</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s purchases</CardTitle>
          <CardDescription>Paid / pending status per store (supplier)</CardDescription>
        </CardHeader>
        <CardContent>
          {d.purchaseRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchases yet today.</p>
          ) : (
            <ul className="divide-y">
              {d.purchaseRows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <span className="font-medium">{row.sourceName}</span>
                    <div className="mt-1"><StatusBadge status={row.paymentStatus} /></div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="tabular-nums font-medium">{formatInrFromPaise(row.amountPaise)}</p>
                    {row.pendingPaise > 0 && (
                      <p className="text-amber-700">Pending {formatInrFromPaise(row.pendingPaise)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {(monthSummary?.totalPendingPaise ?? 0) > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-800">
                Total supplier pending this month:{' '}
                <strong>{formatInrFromPaise(monthSummary!.totalPendingPaise)}</strong>
              </p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                <Link to="/purchases">View all purchases</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
