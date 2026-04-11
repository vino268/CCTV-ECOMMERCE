'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
  login: (userData: AuthUser | null) => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (updates: Partial<AuthUser> | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim();

function buildApiUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/auth/me'), {
        cache: 'no-store',
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setUser(null);
        window.dispatchEvent(new Event('user-auth-change'));
        return null;
      }

      const nextUser = data?.user || null;
      setUser(nextUser);
      window.dispatchEvent(new Event('user-auth-change'));
      return nextUser;
    } catch {
      setUser(null);
      window.dispatchEvent(new Event('user-auth-change'));
      return null;
    }
  };

  const login = (userData: AuthUser | null) => {
    setUser(userData);
    window.dispatchEvent(new Event('user-auth-change'));
  };

  const logout = async () => {
    try {
      await fetch(buildApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors and still clear local auth state.
    }

    setUser(null);
    window.dispatchEvent(new Event('user-auth-change'));
  };

  const updateUser = (updates: Partial<AuthUser> | null) => {
    setUser((prev) => {
      return prev ? { ...prev, ...(updates || {}) } : prev;
    });

    window.dispatchEvent(new Event('user-auth-change'));
  };

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
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      isAuthenticated: Boolean(user),
      loading,
      refreshUser,
      updateUser,
      logout,
    }),
    [user, loading]
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
