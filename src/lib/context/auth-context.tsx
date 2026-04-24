'use client';

/**
 * Lightweight Auth Context
 *
 * Thin wrapper around Supabase auth for the consumer app.
 * Designed to be easily swapped for a production auth solution later.
 *
 * Stores minimal session info (user id + email) in state.
 * Guest users authenticate via Supabase Auth directly in the browser so
 * that auth.uid() is available for RLS policies. Staff demo accounts fall
 * through to the /api/auth/login route which validates hardcoded credentials.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const STORAGE_KEY = 'stayscape_auth';

// Staff email addresses that authenticate via the API route (not Supabase Auth).
// Must stay in sync with STAFF_DEMO_CREDENTIALS in src/app/api/auth/login/route.ts.
const STAFF_EMAILS = ['staff@stayscape-demo.com'];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, rehydrate from an existing Supabase session or sessionStorage (staff).
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? '' });
        } else {
          // No Supabase session — fall back to sessionStorage for staff.
          try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) setUser(JSON.parse(stored) as AuthUser);
          } catch {
            // ignore
          }
        }
        setIsLoading(false);
      });
    } else {
      // Supabase not configured — fall back to sessionStorage.
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) setUser(JSON.parse(stored) as AuthUser);
      } catch {
        // ignore
      }
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const supabase = getSupabaseBrowser();

      if (supabase) {
        // Try Supabase Auth directly in the browser first.
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email ?? '',
          };
          setUser(authUser);
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          } catch {
            // ignore
          }
          return {};
        }

        // Sign-in failed — only fall through to the API route for staff.
        if (!STAFF_EMAILS.includes(email)) {
          return { error: 'Invalid credentials' };
        }
      }

      // Staff accounts (or Supabase not configured) — authenticate via API route.
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          return { error: data.error ?? 'Login failed' };
        }

        const authUser: AuthUser = { id: data.user.id, email: data.user.email };
        setUser(authUser);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        } catch {
          // ignore
        }
        return {};
      } catch {
        return { error: 'Network error. Please try again.' };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    // Sign out of Supabase (fire-and-forget — we clear local state regardless).
    const supabase = getSupabaseBrowser();
    if (supabase) {
      supabase.auth.signOut().catch(() => {
        // Ignore sign-out errors; local state is cleared regardless.
      });
    }
    setUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
