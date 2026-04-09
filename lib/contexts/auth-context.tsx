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
  updateUser: (updates: Partial<AuthUser> | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!res.ok) {
        setUser(null);
        try {
          localStorage.removeItem('token');
        } catch {
          // Ignore storage errors.
        }
        window.dispatchEvent(new Event('user-auth-change'));
        return null;
      }

      const data = await res.json();
      const nextUser = data?.user || null;
      setUser(nextUser);
      window.dispatchEvent(new Event('user-auth-change'));
      return nextUser;
    } catch {
      setUser(null);
      try {
        localStorage.removeItem('token');
      } catch {
        // Ignore storage errors.
      }
      window.dispatchEvent(new Event('user-auth-change'));
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors; local auth state must still be cleared.
    }

    setUser(null);
    try {
      localStorage.removeItem('token');
    } catch {
      // Ignore storage errors.
    }
    window.dispatchEvent(new Event('user-auth-change'));
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser> | null) => {
    setUser((prev) => {
      return prev ? { ...prev, ...(updates || {}) } : prev;
    });

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
      updateUser,
      logout,
    }),
    [user, loading, refreshUser, updateUser, logout]
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
