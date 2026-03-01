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
import { apiUrl } from '@/lib/api-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  role: 'farmer' | 'doctor' | 'admin' | 'buyer';
  full_name: string;
  is_verified: boolean;
  verification_status: 'pending_verification' | 'active' | 'rejected';
  phone?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
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
  role: 'farmer' | 'doctor' | 'buyer';
  veterinary_license?: string;
  veterinary_college?: string;
  specialization?: string;
  years_of_experience?: number;
  business_name?: string;
  market_name?: string;
  district?: string;
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
    case 'buyer': return '/dashboard/buyer';
    case 'farmer': return '/';
    default: return '/';
  }
}

async function apiFetch(path: string, body: object) {
  const res = await fetch(apiUrl(path), {
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
      // Background validate - gracefully handle missing backend
      fetch(apiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else if (data === null) {
            // Token invalid, clear session
            clearSession();
            setUser(null);
          }
          // If data is undefined (network error), keep cached user
        })
        .catch((err) => {
          // Network error or backend unavailable - keep cached user
          console.warn('[Auth] Backend unavailable, using cached session:', err.message);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string, role?: string) => {
      console.log(`[Auth] login called: email=${email}, role=${role}`);
      const data = await apiFetch('/api/auth/login', { email, password, role });
      console.log(`[Auth] login response role: ${data.user?.role}`);
      storeSession(data.access_token, data.refresh_token, data.user);
      setUser(data.user);
      router.push(getDashboardPath(data.user.role));
    },
    [router],
  );

  const signup = useCallback(
    async (body: SignupData) => {
      console.log(`[Auth] signup called: email=${body.email}, role=${body.role}`);
      const data = await apiFetch('/api/auth/signup', body);
      console.log(`[Auth] signup response role: ${data.user?.role}`);
      if (data.user?.role !== body.role) {
        console.error(`[Auth] ROLE MISMATCH! Expected=${body.role}, Got=${data.user?.role}`);
      }
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
    fetch(apiUrl('/api/auth/logout'), { method: 'POST' }).catch(() => {});
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/auth/me'), {
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
