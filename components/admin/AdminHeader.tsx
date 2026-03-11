'use client';

import { Search, Menu, LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/admin/NotificationBell';
import AdminAccountMenu from '@/components/admin-account-menu';

type AdminHeaderProps = {
  onToggleSidebar: () => void;
  onLogout: () => void;
};

export function AdminHeader({ onToggleSidebar, onLogout }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-semibold text-foreground">Admin Panel</h1>
        </div>
      </div>

      <div className="hidden lg:flex items-center w-full max-w-md rounded-lg border border-border bg-background px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <NotificationBell />
        <AdminAccountMenu />
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
