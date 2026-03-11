'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AdminAccountMenu from '@/components/admin-account-menu';

export default function AdminHeader() {
  // Placeholder search query — wire up to your search API as needed
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown on outside click or ESC
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Placeholder notifications — replace with real data from your API
  const notifications = [
    { id: 1, message: 'New order received (#1042)', time: '2 min ago' },
    { id: 2, message: 'New customer registered', time: '10 min ago' },
    { id: 3, message: 'Product stock low: Dome Camera', time: '1 hr ago' },
  ];

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left: Title */}
      <h1 className="text-lg font-semibold text-foreground hidden sm:block">
        TN Automation Admin Panel
      </h1>

      {/* Right: Search + Notifications + Account */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-56 h-9 text-sm"
          />
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Notifications panel"
              className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">
                  Notifications
                </p>
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-foreground text-center">
                  No new notifications
                </p>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="flex flex-col px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                    >
                      <span className="text-sm text-foreground">
                        {n.message}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {n.time}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Admin account dropdown */}
        <AdminAccountMenu />
      </div>
    </header>
  );
}
