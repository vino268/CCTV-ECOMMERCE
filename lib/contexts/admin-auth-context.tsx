'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { parseResponseBody } from '@/lib/http-response';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  profileImage?: string;
  avatar?: string;
  createdAt?: string;
  avatarVersion?: number;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  loading: boolean;

  updateAdmin: (updates: Partial<AdminUser> | null) => void;
  setAdmin: (admin: AdminUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);



  const updateAdmin = useCallback((updates: Partial<AdminUser> | null) => {
    setAdmin((prev) => {
      if (!prev) return prev;
      return { ...prev, ...(updates || {}) };
    });
  }, []);

  const clearAdmin = useCallback(() => {
    setAdmin(null);
  }, []);

  // Removed auto-fetch useEffect to prevent double fetching.
  // The layout will call refreshAdmin directly when needed.


  const value = useMemo(
    () => ({
      admin,
      loading,
      updateAdmin,
      setAdmin: (newAdmin: AdminUser | null) => setAdmin(newAdmin),
      setLoading: (newLoading: boolean) => setLoading(newLoading),
      clearAdmin,
    }),
    [admin, loading, updateAdmin, clearAdmin]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
