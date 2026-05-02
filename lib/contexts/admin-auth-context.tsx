'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  refreshAdmin: () => Promise<AdminUser | null>;
  updateAdmin: (updates: Partial<AdminUser> | null) => void;
  clearAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = useMemo(() => {
    const envBase = String(process.env.NEXT_PUBLIC_API_URL || '')
      .trim()
      .replace(/\/+$/, '');
    return envBase;
  }, []);

  const buildApiUrl = (path: string) => {
    if (/^https?:\/\//i.test(path)) return path;
    if (!apiBaseUrl) return path;
    if (!path.startsWith('/')) return `${apiBaseUrl}/${path}`;
    return `${apiBaseUrl}${path}`;
  };

  const refreshAdmin = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/admin/profile'), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await parseResponseBody<{ success?: boolean; admin?: AdminUser }>(res);
      if (!res.ok || data?.success === false || !data?.admin) {
        setAdmin(null);
        return null;
      }

      const nextAdmin: AdminUser = {
        _id: String(data.admin._id),
        name: String(data.admin.name || ''),
        email: String(data.admin.email || ''),
        phone: String(data.admin.phone || ''),
        role: String(data.admin.role || 'admin'),
        profileImage: String(data.admin.profileImage || data.admin.avatar || ''),
        avatar: String(data.admin.avatar || data.admin.profileImage || ''),
        createdAt: data.admin.createdAt,
      };

      setAdmin((prev) => ({
        ...nextAdmin,
        avatarVersion: prev?.avatarVersion,
      }));

      return nextAdmin;
    } catch {
      setAdmin(null);
      return null;
    }
  };

  const updateAdmin = (updates: Partial<AdminUser> | null) => {
    setAdmin((prev) => {
      if (!prev) return prev;
      return { ...prev, ...(updates || {}) };
    });
  };

  const clearAdmin = () => {
    setAdmin(null);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      await refreshAdmin();
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
      admin,
      loading,
      refreshAdmin,
      updateAdmin,
      clearAdmin,
    }),
    [admin, loading]
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
