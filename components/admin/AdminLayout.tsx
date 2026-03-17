'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

type AdminLayoutProps = {
  children: React.ReactNode;
  onLogout: () => void;
};

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar: fixed width, always visible on desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
        <AdminSidebar isOpen={true} onClose={closeSidebar} />
      </aside>
      {/* Mobile sidebar overlay */}
      <div className="md:hidden">
        <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Main content area */}
      <main className="flex-1 w-full flex flex-col min-w-0">
        <AdminHeader onLogout={onLogout} onMenuClick={openSidebar} />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
