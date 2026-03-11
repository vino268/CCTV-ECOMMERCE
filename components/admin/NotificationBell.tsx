'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Trash2, CheckCheck } from 'lucide-react';

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // silently ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => {
          const removed = prev.find((n) => n._id === id);
          const next = prev.filter((n) => n._id !== id);
          if (removed && !removed.read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return next;
        });
      }
    } catch {
      // silently ignore
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications', { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    const notification = notifications.find((n) => n._id === id);
    if (!notification || notification.read) return;
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // silently ignore
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const typeColor: Record<string, string> = {
    order: 'bg-blue-100 text-blue-700',
    product: 'bg-green-100 text-green-700',
    customer: 'bg-purple-100 text-purple-700',
    system: 'bg-orange-100 text-orange-700',
    info: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <span className="text-sm font-semibold text-foreground">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={loading}
                  title="Clear all notifications"
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors ${
                    !n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          typeColor[n.type] ?? typeColor.info
                        }`}
                      >
                        {n.type}
                      </span>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium text-foreground truncate ${!n.read ? 'cursor-pointer' : ''}`}
                      onClick={() => handleMarkRead(n._id)}
                      title={n.title}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                    aria-label="Delete notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
