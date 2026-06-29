import { useEffect, useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MonthlyTargetStrip } from '@/components/dashboard/MonthlyTargetCard';
import { KolkataDateTime } from '@/components/layout/KolkataDateTime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const shopNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { to: '/vakro', label: 'Vakro', icon: Wallet },
  { to: '/kharcho', label: 'Kharcho', icon: Receipt },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/ai', label: 'AI Turnover', icon: Sparkles },
];

const adminNav: NavItem[] = [{ to: '/admin', label: 'Shops', icon: Store }];

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {items.map(({ to, label, icon: Icon, badge }) => {
        const active = pathname === to;
        return (
          <li key={to}>
            <Link
              to={to}
              onClick={onNavigate}
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
  );
}

export function AppShell() {
  const { user, shop, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = user?.role === 'admin' ? adminNav : shopNav;

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
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

      {/* Mobile / tablet sidebar drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!sidebarOpen}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-300',
            sidebarOpen ? 'opacity-100' : 'opacity-0',
          )}
          aria-label="Close menu"
          onClick={closeSidebar}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r bg-white shadow-xl transition-transform duration-300 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{shop?.name ?? 'TurnOverCheck'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            <NavLinks items={nav} pathname={location.pathname} onNavigate={closeSidebar} />
          </nav>
          <div className="border-t p-3">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 sm:py-6">
        <nav className="hidden w-52 shrink-0 lg:block" aria-label="Main navigation">
          <NavLinks items={nav} pathname={location.pathname} />
        </nav>

        <main className="min-w-0 flex-1 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
