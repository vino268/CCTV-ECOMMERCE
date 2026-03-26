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
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';

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
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';
  const isPublicPage =
    isLoginPage || pathname === '/admin/forgot-password' || pathname === '/admin';

  useEffect(() => {
    if (isPublicPage) {
      setAuthChecked(true);
      return;
    }

    const verifyAdminSession = async () => {
      try {
        const res = await fetch('/api/admin/profile', { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 403) {
            router.replace('/admin/login?error=unauthorized');
            return;
          }

          router.replace('/admin/login?error=unauthorized');
          return;
        }
        setAuthChecked(true);
      } catch {
        router.replace('/admin/login');
      }
    };

    verifyAdminSession();
  }, [isPublicPage, router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between bg-slate-800 text-gray-100 p-4 shadow md:hidden fixed top-0 left-0 w-full z-40">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open sidebar"
          className="p-1"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-semibold">Admin</h1>
        <div />
      </div>

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
        className={`flex-1 overflow-y-auto transition-all duration-300 px-4 pb-4 ${
          isCollapsed ? 'md:ml-[70px]' : 'md:ml-64'
        } bg-gray-50`}
      >
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <AdminHeader onLogout={handleLogout} />
        </div>
        <div className="pt-4">
          {children}
        </div>
      </main>
    </div>
  );
}
