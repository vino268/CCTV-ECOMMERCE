'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Loader2,
  Clock,
  Package,
  ShoppingCart,
  KeyRound,
  Settings,
  Wrench,
  Trash2,
} from 'lucide-react';

type LogEntry = {
  _id: string;
  action: string;
  adminName: string;
  details: string;
  createdAt: string;
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getActionIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes('product')) return Package;
  if (a.includes('order')) return ShoppingCart;
  if (a.includes('password')) return KeyRound;
  if (a.includes('setting')) return Settings;
  if (a.includes('service')) return Wrench;
  if (a.includes('delet')) return Trash2;
  return Activity;
}

function getActionColor(action: string) {
  const a = action.toLowerCase();
  if (a.includes('added') || a.includes('created')) return 'bg-green-100 text-green-600';
  if (a.includes('updated') || a.includes('changed')) return 'bg-blue-100 text-blue-600';
  if (a.includes('deleted') || a.includes('cancelled') || a.includes('canceled'))
    return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-600';
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/activity')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.logs)) setLogs(data.logs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-muted-foreground text-sm">
          Recent admin activity — {logs.length} entries
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No activity recorded yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const Icon = getActionIcon(log.action);
              const colorClass = getActionColor(log.action);
              return (
                <div
                  key={log._id}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {log.adminName}{' '}
                      <span className="font-normal text-muted-foreground">
                        {log.action.toLowerCase()}
                      </span>
                      {log.details && (
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          — {log.details}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5" />
                    {timeAgo(log.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
