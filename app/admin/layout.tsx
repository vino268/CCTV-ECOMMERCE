'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import { fetchWithAuth } from '@/utils/api';
import { AdminAuthProvider, useAdminAuth } from '@/lib/contexts/admin-auth-context';
import { getAdminAuthHeaders } from '@/lib/admin-auth';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Wrench },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/trash', label: 'Trash', icon: Trash2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  // Use same-origin relative paths for production
  const API_BASE = '';
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading: adminLoading, clearAdmin, refreshAdmin } = useAdminAuth();

  const isLoginPage = pathname === '/admin/login';
  const isPublicPage =
    isLoginPage || pathname === '/admin/forgot-password' || pathname === '/admin';

  useEffect(() => {
    if (isPublicPage) {
      setAuthChecked(true);
      return;
    }

    if (adminLoading) {
      return;
    }

    if (admin?._id) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;

    const validateAdminSession = async () => {
      try {
        const refreshedAdmin = await refreshAdmin();
        if (cancelled) return;

        if (refreshedAdmin?._id) {
          setAuthChecked(true);
          return;
        }

        // If we get here, no valid admin session
        if (!cancelled) {
          setAuthChecked(false);
          // Only redirect if not already on login page
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
            router.refresh();
          }
        }
      } catch (error) {
        if (!cancelled) {
          setAuthChecked(false);
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
            router.refresh();
          }
        }
      }
    };

    validateAdminSession();

    return () => {
      cancelled = true;
    };
  }, [admin?._id, adminLoading, isPublicPage, pathname, refreshAdmin, router]);

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        cache: 'no-store',
      });
    } finally {
      clearAdmin();
      router.replace('/admin/login');
      router.refresh();
    }
  };

  // Overlay for mobile drawer
  const overlay = mobileSidebarOpen && (
    <div
      className="fixed inset-0 bg-black/40 z-[900] md:hidden"
      onClick={() => setMobileSidebarOpen(false)}
    />
  );

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      {overlay}
      <aside
        className={`
          fixed
          top-0
          left-0
          h-full
          ${isCollapsed ? 'md:w-[70px]' : 'md:w-64'}
          w-64
          bg-slate-800
          text-gray-300
          z-[1000]
          transform
          transition-all
          duration-300
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ willChange: 'transform, width' }}
      >
        <div className="h-16 flex items-center px-3 border-b border-white/10">
          <span className={`font-bold text-white text-lg transition-opacity ${isCollapsed ? 'md:opacity-0 md:w-0 overflow-hidden' : 'opacity-100'}`}>
            Admin
          </span>

          {/* Desktop collapse toggle */}
          <button
            className="ml-auto hidden md:flex items-center justify-center w-8 h-8 rounded-md text-gray-300 hover:bg-white/10 transition"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            className="ml-auto md:hidden flex items-center justify-center w-8 h-8 rounded-md text-gray-300 hover:bg-white/10 transition"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={`flex items-center ${isCollapsed ? 'md:justify-center' : ''} gap-3 px-3 py-3 rounded-lg border-l-4 transition-all duration-200 hover:bg-white/10 ${
                    isActive
                      ? 'bg-white/10 text-white border-blue-500'
                      : 'text-gray-300 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`text-sm font-medium whitespace-nowrap transition-all ${
                      isCollapsed ? 'md:hidden' : 'inline'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 px-3 pt-0 pb-0 md:px-4 ${
          isCollapsed ? 'md:ml-[70px]' : 'md:ml-64'
        } bg-gray-50`}
      >
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
          <AdminHeader onLogout={handleLogout} onMenuOpen={() => setMobileSidebarOpen(true)} />
        </div>
        <div className="first-section flex-1 overflow-y-auto mt-0 px-3 py-2 md:px-0 md:pt-4 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
