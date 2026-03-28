'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  profileImage?: string;
  role?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setUser(null);
        window.dispatchEvent(new Event('user-auth-change'));
        return null;
      }

      const data = await res.json();
      const nextUser = data?.user || null;
      setUser(nextUser);
      try {
        if (nextUser) {
          localStorage.setItem('user', JSON.stringify(nextUser));
        } else {
          localStorage.removeItem('user');
        }
      } catch {
        // Ignore localStorage errors in restricted environments.
      }
      window.dispatchEvent(new Event('user-auth-change'));
      return nextUser;
    } catch {
      setUser(null);
      try {
        localStorage.removeItem('user');
      } catch {
        // Ignore localStorage errors in restricted environments.
      }
      window.dispatchEvent(new Event('user-auth-change'));
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors; local auth state must still be cleared.
    }

    setUser(null);
    try {
      localStorage.removeItem('user');
    } catch {
      // Ignore localStorage errors in restricted environments.
    }
    window.dispatchEvent(new Event('user-auth-change'));
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      await refreshUser();
      if (mounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      refreshUser,
      logout,
    }),
    [user, loading, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
