import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/ui/loader';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PurchasesPage } from '@/pages/PurchasesPage';
import { VakroPage } from '@/pages/VakroPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { AiInsightsPage } from '@/pages/AiInsightsPage';
import { KharchoPage } from '@/pages/KharchoPage';
import { AdminPage } from '@/pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        toast.error(message);
      },
    },
  },
});

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader fullScreen label="Signing in…" />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') {
    return (
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    );
  }

  if (user.role !== 'shop') {
    return <div className="p-8">Wholesaler portal coming soon.</div>;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="vakro" element={<VakroPage />} />
        <Route path="kharcho" element={<KharchoPage />} />
        <Route path="galla" element={<Navigate to="/vakro" replace />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="ai" element={<AiInsightsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-center" closeButton expand duration={3500} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
