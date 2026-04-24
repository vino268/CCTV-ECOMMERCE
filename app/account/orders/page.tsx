'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import OrderCard, { type AccountOrder } from '@/components/order-card';
import CancelOrderModal from '@/components/cancel-order-modal';
import ToastNotification from '@/components/ui/toast-notification';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState('');
  const [cancelModalOrderId, setCancelModalOrderId] = useState('');
  const { toast, showError, showSuccess } = useToast();
  const hasFetchedOnceRef = useRef(false);
  const statusSnapshotRef = useRef<Record<string, string>>({});

  const normalizeStatus = (raw?: string) => {
    const value = String(raw || '').trim().toLowerCase();
    if (value === 'pending' || value === 'ordered') return 'Ordered';
    if (value === 'packed' || value === 'confirmed') return 'Packed';
    if (value === 'shipped') return 'Shipped';
    if (value === 'outfordelivery' || value === 'out for delivery' || value === 'out_for_delivery') return 'Out for Delivery';
    if (value === 'delivered') return 'Delivered';
    if (value === 'cancelled') return 'Cancelled';
    return 'Ordered';
  };

  const safePush = (href: string) => {
    try {
      router.push(href);
    } catch (err) {
      console.error('Navigation failed', err);
      if (typeof window !== 'undefined') {
        window.location.assign(href);
      }
    }
  };

  const safeReplace = (href: string) => {
    try {
      router.replace(href);
    } catch (err) {
      console.error('Navigation failed', err);
      if (typeof window !== 'undefined') {
        window.location.replace(href);
      }
    }
  };

  const fetchOrders = async (userId: string, email: string, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError('');

    try {
      const getOrdersFrom = async (path: string) => {
        const res = await fetch(buildApiUrl(path), {
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await parseResponseBody<AccountOrder[] | { error?: string; message?: string }>(res);
        const errorPayload = !Array.isArray(data) ? data : {};

        if (res.status === 401) {
          return { unauthorized: true as const, orders: [] as AccountOrder[] };
        }

        if (!res.ok) {
          return {
            unauthorized: false as const,
            orders: [] as AccountOrder[],
            error: errorPayload.error || errorPayload.message || 'Failed to fetch orders',
          };
        }

        return { unauthorized: false as const, orders: Array.isArray(data) ? data : [] };
      };

      const primary = await getOrdersFrom(`/api/orders/user/${encodeURIComponent(email)}`);

      if (primary.unauthorized) {
        safeReplace('/login?redirect=/account/orders');
        return;
      }

      const nextOrders = primary.orders;
      const resolvedError = primary.error;

      if (resolvedError) {
        setOrders([]);
        setError(resolvedError);
        return;
      }

      const nextSnapshot: Record<string, string> = {};
      for (const order of nextOrders) {
        const orderId = String(order?._id || '');
        if (!orderId) continue;
        nextSnapshot[orderId] = normalizeStatus(order?.status || order?.trackingStatus || order?.orderStatus);
      }

      if (hasFetchedOnceRef.current) {
        for (const order of nextOrders) {
          const orderId = String(order?._id || '');
          if (!orderId) continue;
          const prevStatus = statusSnapshotRef.current[orderId];
          const nextStatus = nextSnapshot[orderId];
          if (prevStatus && nextStatus && prevStatus !== nextStatus) {
            showSuccess(`Order status updated to ${nextStatus}`);
            break;
          }
        }
      }

      hasFetchedOnceRef.current = true;
      statusSnapshotRef.current = nextSnapshot;
      setOrders(nextOrders);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch orders');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user?.email) {
      safeReplace('/login?redirect=/account/orders');
      return;
    }
    const uid = String(user?._id || '');
    const email = String(user?.email || '');

    fetchOrders(uid, email);

    const intervalId = window.setInterval(() => {
      fetchOrders(uid, email, { silent: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [router, authLoading, isAuthenticated, user?._id, user?.email]);

  const handleCancelOrder = (orderId: string) => {
    setCancelModalOrderId(orderId);
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrderId) return;

    setCancellingId(cancelModalOrderId);
    setError('');

    try {
      const res = await fetch(buildApiUrl(`/api/orders/${cancelModalOrderId}/cancel`), {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await parseResponseBody<{ success?: boolean; message?: string; order?: Partial<AccountOrder> }>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order._id === cancelModalOrderId ? { ...order, ...data.order } : order
        )
      );
      showSuccess(data.message || 'Order status updated successfully');
    } catch (err: any) {
      const message = err.message || 'Failed to cancel order';
      setError(message);
      showError(message);
    } finally {
      setCancellingId('');
      setCancelModalOrderId('');
    }
  };

  const orderedByDate = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            title="Go Back"
            aria-label="Go Back"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md transition-all duration-200 hover:scale-105 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <nav aria-label="Breadcrumb" className="mb-2 text-xs sm:text-sm text-gray-500">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-gray-700 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/account" className="hover:text-gray-700 transition-colors duration-200">
                  Account
                </Link>
              </li>
              <li>/</li>
              <li className="font-medium text-gray-900">Orders</li>
            </ol>
          </nav>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500">Track and manage your complete order history</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 mb-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : orderedByDate.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">You have no orders yet</h2>
            <p className="mt-1 text-sm text-gray-500">Once you place an order, it will appear here.</p>
            <Button className="mt-5" onClick={() => safePush('/products')}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orderedByDate.map((order) => {
              return (
                <OrderCard
                  key={order._id}
                  order={order}
                  isCancelling={cancellingId === order._id}
                  onCancel={handleCancelOrder}
                />
              );
            })}
          </div>
        )}
      </div>

      <CancelOrderModal
        open={Boolean(cancelModalOrderId)}
        isProcessing={Boolean(cancelModalOrderId) && cancellingId === cancelModalOrderId}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Confirm"
        processingText="Cancelling..."
        onOpenChange={(open) => {
          if (!open && !cancellingId) setCancelModalOrderId('');
        }}
        onConfirm={handleConfirmCancelOrder}
      />

      <ToastNotification toast={toast} />
    </div>
  );
}
