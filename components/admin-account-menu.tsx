'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, KeyRound, HelpCircle, Settings, LogOut, ChevronDown } from 'lucide-react';
import LogoutConfirmModal from '@/components/logout-confirm-modal';

export default function AdminAccountMenu() {
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get admin info from backend
  const [adminName, setAdminName] = useState('A');
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const res = await fetch('/api/admin/profile', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const admin = data?.admin;
        if (admin) {
          setAdminName(admin.name || admin.email?.charAt(0)?.toUpperCase() || 'A');
        }
      } catch {
        // Ignore profile fetch issues here.
      }

    };

    loadAdmin();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    setShowLogoutModal(false);
    router.replace('/admin/login');
  };

  const handleOpenLogoutModal = () => {
    setOpen(false);
    setShowLogoutModal(true);
  };

  const initial = adminName.length === 1 ? adminName : adminName.charAt(0).toUpperCase();

  const menuItems = [
    { href: '/admin/profile', label: 'Admin Profile', icon: User },
    { href: '/admin/change-password', label: 'Change Password', icon: KeyRound },
    { href: '/admin/forgot-password', label: 'Forgot Password', icon: HelpCircle },
    { href: '/admin/settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
          {initial}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Admin info header */}
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <p className="text-sm font-semibold text-foreground truncate">{adminName}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleOpenLogoutModal}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      <LogoutConfirmModal
        open={showLogoutModal}
        isProcessing={isLoggingOut}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isLoggingOut) setShowLogoutModal(false);
        }}
        onConfirm={handleLogout}
      />
    </div>
  );
}
