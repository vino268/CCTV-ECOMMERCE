'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';

interface Notification {
  _id: string;
  type: 'new_order' | 'order_cancelled' | 'new_user';
  message: string;
  orderId: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  new_order:       '🛒',
  order_cancelled: '❌',
  new_user:        '👤',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch {
      // silent fail — UI will just show stale data
    }
  };

  // Initial load + 30-second polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      // Optimistically mark all read in UI
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Persist to server
      await fetch('/api/admin/notifications', { method: 'PATCH' });
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch('/api/admin/notifications', { method: 'PATCH' });
  };

  const handleDeleteNotification = async (id: string) => {
    const previous = notifications;
    setDeletingId(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));

    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete notification');
      }
    } catch {
      // Revert optimistic update if delete fails
      setNotifications(previous);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`group flex items-start gap-3 px-4 py-3 text-sm transition-colors ${
                    n.isRead ? 'bg-white' : 'bg-blue-50'
                  }`}
                >
                  <span className="text-base mt-0.5 shrink-0">
                    {TYPE_ICON[n.type] ?? '🔔'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`leading-snug ${
                        n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    <button
                      onClick={() => handleDeleteNotification(n._id)}
                      disabled={deletingId === n._id}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                      aria-label="Delete notification"
                      title="Delete notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
