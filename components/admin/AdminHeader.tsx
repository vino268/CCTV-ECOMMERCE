'use client';

import { Search, Menu, LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/admin/NotificationBell';
import AdminAccountMenu from '@/components/admin-account-menu';

type AdminHeaderProps = {
  onToggleMobileSidebar: () => void;
  onLogout: () => void;
};

export function AdminHeader({ onToggleMobileSidebar, onLogout }: AdminHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
          <p className="hidden sm:block text-xs text-gray-500">Management Console</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 w-full max-w-sm mx-4">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search admin data..."
          className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <AdminAccountMenu />
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
