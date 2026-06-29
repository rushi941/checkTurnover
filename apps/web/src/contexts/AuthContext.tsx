import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthResponse, Shop, User } from '@turnover/shared';
import { apiFetch, setToken, ApiError } from '@/lib/api';

interface AuthState {
  user: User | null;
  shop: Shop | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('turnover_token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ data: { user: User } }>('/auth/me')
      .then(() => {
        const stored = localStorage.getItem('turnover_auth');
        if (stored) {
          const parsed = JSON.parse(stored) as AuthResponse;
          setUser(parsed.user);
          setShop(parsed.shop);
        }
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem('turnover_auth');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<{ data: AuthResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.data.token);
    localStorage.setItem('turnover_auth', JSON.stringify(res.data));
    setUser(res.data.user);
    setShop(res.data.shop);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('turnover_auth');
    setUser(null);
    setShop(null);
  }

  return (
    <AuthContext.Provider value={{ user, shop, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useShopId(): string {
  const { user, shop } = useAuth();
  if (user?.role === 'shop' && shop) return shop.id;
  throw new Error('No shop context');
}

export { ApiError };
