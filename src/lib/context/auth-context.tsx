'use client';

/**
 * Lightweight Auth Context
 *
 * Thin wrapper around Supabase auth for the consumer app.
 * Designed to be easily swapped for a production auth solution later.
 *
 * Stores minimal session info (user id + email) in state.
 * No persistent session management — login sets state, logout clears it.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  // isLoading is always false because sessionStorage.getItem is synchronous —
  // by the time the component renders, user is already resolved.
  const isLoading = false;

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
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
