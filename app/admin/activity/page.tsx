'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { getAdminAuthHeaders } from '@/lib/admin-auth';
import { buildApiUrl } from '@/lib/http-response';

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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [clearingAll, setClearingAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'single' | 'all' | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchLogs = useCallback((targetPage: number) => {
    setLoading(true);
    setError('');

    fetch(`/api/admin/activity?page=${targetPage}&limit=${pageSize}`, {
      credentials: 'include',
      headers: getAdminAuthHeaders(),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
          setHasNextPage(Boolean(data.pagination?.hasNextPage));
          setHasPrevPage(Boolean(data.pagination?.hasPrevPage));
          setTotal(Number(data.pagination?.total || 0));
        } else {
          setError(data.message || 'Failed to load activity');
        }
      })
      .catch(() => setError('Failed to load activity'))
      .finally(() => setLoading(false));
  }, [pageSize]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setActionType('single');
    setShowModal(true);
  };

  const handleClearAll = () => {
    setActionType('all');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (actionType === 'single' && !selectedId) return;

    setError('');
    setSuccess('');

    try {
      let res: Response;

      if (actionType === 'single') {
        setDeletingId(selectedId || '');
        res = await fetch(`/api/admin/activity/${selectedId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: getAdminAuthHeaders(),
        });
      } else {
        setClearingAll(true);
        res = await fetch('/api/admin/activity', {
          method: 'DELETE',
          credentials: 'include',
          headers: getAdminAuthHeaders(),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || (actionType === 'all' ? 'Failed to clear logs' : 'Failed to delete log')
        );
      }

      setShowModal(false);
      setSelectedId(null);
      setActionType('');
      setSuccess(actionType === 'all' ? 'All logs cleared' : 'Log deleted successfully');
      const nextPage = actionType === 'all' ? 1 : page;
      if (actionType === 'all') setPage(1);
      fetchLogs(nextPage);
    } catch (err: any) {
      setError(err.message || 'Failed to perform action');
    } finally {
      setDeletingId('');
      setClearingAll(false);
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
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
            <p className="text-muted-foreground text-sm">
              Recent admin activity — {total} total entries
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearingAll || total === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            {clearingAll ? 'Clearing...' : 'Clear All Logs'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No activity logs available</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
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
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(log._id)}
                    disabled={deletingId === log._id || clearingAll}
                    className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete activity log"
                  >
                    {deletingId === log._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} • Showing up to {pageSize} newest logs
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!hasPrevPage || loading}
                className="px-3 py-1.5 text-sm rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!hasNextPage || loading}
                className="px-3 py-1.5 text-sm rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 animate-scaleIn">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 text-red-500 p-2 rounded-full" aria-hidden="true">
                ⚠️
              </div>

              <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              {actionType === 'all'
                ? 'This will delete all activity logs. Continue?'
                : 'Are you sure you want to delete this log?'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!deletingId && !clearingAll) {
                    setShowModal(false);
                    setSelectedId(null);
                    setActionType('');
                  }
                }}
                disabled={!!deletingId || clearingAll}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmAction}
                disabled={(actionType === 'single' && !selectedId) || !!deletingId || clearingAll}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId || clearingAll ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
