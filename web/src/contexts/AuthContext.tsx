'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  role: 'farmer' | 'doctor' | 'admin';
  full_name: string;
  is_verified: boolean;
  verification_status: 'pending_verification' | 'active' | 'rejected';
  phone?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  adminVerify: (adminId: string) => Promise<boolean>;
  adminLogin: (adminId: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'farmer' | 'doctor';
  veterinary_license?: string;
  veterinary_college?: string;
  specialization?: string;
  years_of_experience?: number;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Helper – API calls (all auth goes through backend, never Supabase)
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'mm_token';
const REFRESH_KEY = 'mm_refresh';
const USER_KEY = 'mm_user';

function storeSession(access: string, refresh: string, user: User) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin': return '/dashboard/admin';
    case 'doctor': return '/dashboard/doctor';
    case 'farmer': return '/dashboard/farmer';
    default: return '/';
  }
}

async function apiFetch(path: string, body: object) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Request failed');
  }
  return data;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Validate stored token on mount
  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();
    if (stored && token) {
      // Quick hydrate from cache
      setUser(stored);
      // Background validate
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else {
            clearSession();
            setUser(null);
          }
        })
        .catch(() => {}) // keep cached user on network error
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch('/api/auth/login', { email, password });
      storeSession(data.access_token, data.refresh_token, data.user);
      setUser(data.user);
      router.push(getDashboardPath(data.user.role));
    },
    [router],
  );

  const signup = useCallback(
    async (body: SignupData) => {
      const data = await apiFetch('/api/auth/signup', body);
      storeSession(data.access_token, data.refresh_token, data.user);
      setUser(data.user);
      router.push(getDashboardPath(data.user.role));
    },
    [router],
  );

  const adminVerify = useCallback(async (adminId: string) => {
    const data = await apiFetch('/api/auth/admin/verify', { admin_id: adminId });
    return !!data.verified;
  }, []);

  const adminLogin = useCallback(
    async (adminId: string, email: string, password: string) => {
      const data = await apiFetch('/api/auth/admin/login', {
        admin_id: adminId,
        email,
        password,
      });
      storeSession(data.access_token, data.refresh_token, data.user);
      setUser(data.user);
      router.push('/dashboard/admin');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      }
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, adminVerify, adminLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
