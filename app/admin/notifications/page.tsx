'use client';

import { useState, useEffect } from 'react';
import { Bell, ShoppingCart, UserPlus, XCircle, Loader2, Trash2 } from 'lucide-react';

type Notification = {
  _id: string;
  type: string;
  message: string;
  orderId: string;
  createdAt: string;
};

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
  user: { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100' },
  cancel: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  system: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch {
      // silent
    }
  };

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
          <p className="text-muted-foreground text-sm">{notifications.length} total notifications</p>
        </div>
      </div>

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
            return (
              <div
                key={n._id}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.bg} ${config.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {n.orderId && (
                      <span className="text-xs font-medium text-primary">{n.orderId}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(n._id)}
                  className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
