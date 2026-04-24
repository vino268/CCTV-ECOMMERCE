'use client';

import { useState, useEffect } from 'react';
import { Bell, ShoppingCart, UserPlus, Loader2, CheckCheck, User, Trash2, X } from 'lucide-react';
import { getAdminAuthHeaders } from '@/lib/admin-auth';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';
import { fetchWithAuth } from '@/utils/api';

type Notification = {
  _id: string;
  title?: string;
  type: string;
  message: string;
  orderId?: string | { _id?: string; orderId?: string; orderNumber?: string };
  isRead: boolean;
  createdAt: string;
};

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
  user: { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100' },
  address: { icon: User, color: 'text-amber-600', bg: 'bg-amber-100' },
  system: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' },
};

function getOrderLabel(orderId: Notification['orderId']) {
  if (!orderId) return '';
  if (typeof orderId === 'string') return orderId;
  return String(orderId.orderId || orderId.orderNumber || orderId._id || '');
}

function toDisplayText(value: unknown) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');

  const fetchNotifications = async (skipLoader = false) => {
    if (!skipLoader) {
      setLoading(true);
    }

    try {
      const res = await fetchWithAuth(buildApiUrl('/api/notifications'), {
        headers: getAdminAuthHeaders(),
      });
      const data = await parseResponseBody<Notification[] | { notifications?: Notification[] }>(res);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
          ? data.notifications
          : [];
      setNotifications(
        [...list].sort(
          (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0)
        )
      );
    } catch {
      // silent
    } finally {
      if (!skipLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchNotifications();

    const intervalId = setInterval(() => {
      void fetchNotifications(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetchWithAuth(buildApiUrl(`/api/notifications/${id}/read`), {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      }
    } catch {
      // silent
    }
  };

  const deleteNotification = async (id: string) => {
    setActionId(id);
    setError('');

    try {
      const res = await fetchWithAuth(buildApiUrl(`/api/notifications/${id}`), {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        if (res.status === 404) throw new Error('Notification not found');
        throw new Error('Failed to delete notification');
      }

      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete notification');
    } finally {
      setActionId('');
    }
  };

  const clearAllNotifications = async () => {
    const confirmed = window.confirm('Delete all notifications permanently?');
    if (!confirmed) return;

    setActionId('all');
    setError('');

    try {
      const res = await fetchWithAuth(buildApiUrl('/api/notifications'), {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to clear notifications');
      }

      setNotifications([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to clear notifications');
    } finally {
      setActionId('');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            {notifications.length} total notifications • {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <Bell className="w-3.5 h-3.5" />
            Unread: {unreadCount}
          </div>
        )}
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={clearAllNotifications}
            disabled={actionId === 'all'}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {actionId === 'all' ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.system;
            const Icon = config.icon;
            const orderLabel = getOrderLabel(n.orderId);
            return (
              <div
                key={n._id}
                className={`bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow ${
                  !n.isRead ? 'ring-1 ring-blue-200 bg-blue-50/40' : ''
                }`}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.bg} ${config.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{n.title || 'Notification'}</p>
                  <p className="text-sm text-foreground/90">{toDisplayText(n.message)}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {orderLabel && (
                      <span className="text-xs font-medium text-primary">{orderLabel}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n._id)}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="text-xs font-medium">Mark Read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotification(n._id)}
                    disabled={actionId === n._id}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                    aria-label="Delete notification"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {actionId === n._id ? 'Deleting...' : 'Delete'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
