import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  BarChart3,
  FileText,
  Sparkles,
  Receipt,
  LogOut,
  Store,
  CalendarDays,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlyTargetStrip } from '@/components/dashboard/MonthlyTargetCard';
import { KolkataDateTime } from '@/components/layout/KolkataDateTime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const shopNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, mobileLabel: 'Home' },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart, mobileLabel: 'Buy' },
  { to: '/vakro', label: 'Vakro', icon: Wallet, mobileLabel: 'Vakro' },
  { to: '/kharcho', label: 'Kharcho', icon: Receipt, mobileLabel: 'Kharcho' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, mobileLabel: 'Cal' },
  { to: '/reports', label: 'Reports', icon: BarChart3, mobileLabel: 'Reports' },
  { to: '/invoices', label: 'Invoices', icon: FileText, mobileLabel: 'Bills' },
  { to: '/ai', label: 'AI Turnover', icon: Sparkles, mobileLabel: 'AI' },
];

const adminNav = [{ to: '/admin', label: 'Shops', icon: Store, mobileLabel: 'Shops' }];

const MOBILE_PRIMARY_COUNT = 5;
const MORE_ROUTES = new Set(['/reports', '/invoices', '/ai', '/calendar']);

export function AppShell() {
  const { user, shop, logout } = useAuth();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const nav = user?.role === 'admin' ? adminNav : shopNav;

  const mobilePrimary = nav.slice(0, MOBILE_PRIMARY_COUNT);
  const mobileMore = nav.slice(MOBILE_PRIMARY_COUNT);
  const isMoreActive = MORE_ROUTES.has(location.pathname);

  function closeMore() {
    setMoreOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-sky-400">
              T
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none">TurnOverCheck</p>
              <p className="truncate text-xs text-muted-foreground">{shop?.name ?? 'Admin'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={logout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <KolkataDateTime />

      {user?.role === 'shop' && <MonthlyTargetStrip />}

      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 sm:py-6">
        <nav className="hidden w-52 shrink-0 lg:block">
          <ul className="space-y-1">
            {nav.map(({ to, label, icon: Icon, badge }: { to: string; label: string; icon: typeof LayoutDashboard; badge?: string }) => {
              const active = location.pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                    {badge && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
          <Outlet />
        </main>
      </div>

      {moreOpen && mobileMore.length > 0 && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            aria-label="Close menu"
            onClick={closeMore}
          />
          <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-50 rounded-xl border bg-white p-2 shadow-lg md:hidden">
            {mobileMore.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMore}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                    active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-1 pb-[env(safe-area-inset-bottom,0px)] pt-1">
          {mobilePrimary.map(({ to, icon: Icon, mobileLabel }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={closeMore}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] leading-tight',
                  active ? 'text-primary font-semibold' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{mobileLabel}</span>
              </Link>
            );
          })}
          {mobileMore.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] leading-tight',
                isMoreActive || moreOpen ? 'text-primary font-semibold' : 'text-muted-foreground',
              )}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
              <span>More</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
