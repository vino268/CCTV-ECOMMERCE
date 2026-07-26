'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatINRCurrency } from '@/lib/currency';
import CancelOrderModal from '@/components/cancel-order-modal';
import {
  ArrowLeft,
  Ban,
  Calendar,
  FileDown,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getSafeImageSrc } from '@/lib/product-image';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

interface OrderProduct {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  image?: string;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface DeliveryInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface DeliveryDetails {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface Order {
  _id: string;
  id?: string;
  orderId?: string;
  orderNumber: string;
  status?: string;
  email: string;
  items?: OrderItem[];
  products: OrderProduct[];
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundInitiatedAt?: string;
  refundedAt?: string;
  orderStatus: string;
  trackingStatus: string;
  createdAt: string;
  address?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  deliveryInfo: DeliveryInfo;
  deliveryDetails?: DeliveryDetails;
}

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

const steps = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusColorMap: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ordered: 'bg-yellow-100 text-yellow-800',
  Packed: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  'Out for Delivery': 'bg-orange-100 text-orange-800',
  'Cancellation Requested': 'bg-amber-100 text-amber-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const statusLabelMap: Record<string, string> = {
  Pending: 'Pending',
  Ordered: 'Ordered',
  Packed: 'Packed',
  Shipped: 'Shipped',
  'Out for Delivery': 'Out for Delivery',
  'Cancellation Requested': 'Cancellation Requested',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

function normalizeStatus(status?: string) {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'Ordered';
  if (value === 'pending' || value === 'ordered') return 'Ordered';
  if (value === 'packed' || value === 'confirmed') return 'Packed';
  if (value === 'shipped') return 'Shipped';
  if (value === 'outfordelivery' || value === 'out for delivery' || value === 'out_for_delivery') return 'Out for Delivery';
  if (value === 'cancellation requested') return 'Cancellation Requested';
  if (value === 'delivered') return 'Delivered';
  if (value === 'cancelled') return 'Cancelled';
  return 'Ordered';
}

function getPaymentMethodLabel(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'cod' || normalized === 'cash on delivery') return 'COD';
  if (normalized === 'razorpay' || normalized === 'online') return 'Online';
  return String(value || 'Online').trim() || 'Online';
}


export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [toast, setToast] = useState<ToastState | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const addressFormInitializedRef = useRef(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });


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

  const fetchOrder = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError('');

    try {
      const res = await fetch(buildApiUrl(`/api/orders/${params.id}`), {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await parseResponseBody<any>(res);

      if (!res.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setOrder((prev) => {
        if (prev) {
          const prevStatus = normalizeStatus(prev?.trackingStatus || prev?.orderStatus);
          const nextStatus = normalizeStatus(data?.trackingStatus || data?.orderStatus);
          if (prevStatus !== nextStatus) {
            setToast({ type: 'success', message: `Order status updated to ${nextStatus}` });
          }
        }
        return data;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [params.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      safeReplace(`/login?redirect=/account/orders/${params.id}`);
      return;
    }

    fetchOrder();

    const intervalId = window.setInterval(() => {
      fetchOrder({ silent: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [fetchOrder, params.id, router, authLoading, isAuthenticated]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (loading || !order) return;
    if (searchParams.get('section') !== 'timeline') return;

    const id = window.requestAnimationFrame(() => {
      document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(id);
  }, [loading, order, searchParams]);

  const currentStatus = useMemo(
    () => normalizeStatus(order?.status || order?.trackingStatus || order?.orderStatus),
    [order]
  );
  const paymentMethodLabel = getPaymentMethodLabel(order?.paymentMethod);
  const paymentStatusLabel = String(order?.paymentStatus || 'Pending').trim() || 'Pending';
  const refundStatusLabel = String(order?.refundStatus || '').trim();

  const displayOrderId = order?.orderId || order?.orderNumber || order?._id;
  const normalizedItems: OrderItem[] = (order?.items && order.items.length > 0)
    ? order.items
    : (order?.products || []).map((item) => ({
        name: item.productName,
        price: item.productPrice,
        quantity: item.quantity,
        image: item.image,
      }));
  const displayDeliveryName =
    order?.address?.fullName ||
    order?.deliveryDetails?.name ||
    `${order?.deliveryInfo?.firstName || ''} ${order?.deliveryInfo?.lastName || ''}`.trim() ||
    'Not provided';
  const displayDeliveryPhone =
    order?.address?.phone ||
    order?.deliveryDetails?.phone ||
    order?.deliveryInfo?.phone ||
    'Not provided';
  const displayDeliveryAddress =
    order?.address?.address ||
    order?.deliveryDetails?.address ||
    [order?.deliveryInfo?.street, order?.deliveryInfo?.city, order?.deliveryInfo?.state, order?.deliveryInfo?.zip]
      .filter((value) => String(value || '').trim())
      .join(', ') ||
    'Not provided';
  const displayDeliveryEmail = order?.address?.email || order?.deliveryDetails?.email || order?.deliveryInfo?.email || 'Not provided';
  const displayDeliveryCity = order?.address?.city || order?.deliveryDetails?.city || order?.deliveryInfo?.city || 'Not provided';
  const displayDeliveryState = order?.address?.state || order?.deliveryDetails?.state || order?.deliveryInfo?.state || 'Not provided';
  const displayDeliveryPincode = order?.address?.pincode || order?.deliveryDetails?.pincode || order?.deliveryInfo?.zip || 'Not provided';

  const statusIndex = steps.indexOf(currentStatus);
  const canCancel = currentStatus === 'Ordered' || currentStatus === 'Packed';
  const isEditable = currentStatus === 'Ordered';
  const isCancellationRequested = currentStatus === 'Cancellation Requested';

  useEffect(() => {
    if (!order) return;
    if (isEditingAddress && addressFormInitializedRef.current) return;

    const fullName =
      order.address?.fullName ||
      order.deliveryDetails?.name ||
      `${order.deliveryInfo?.firstName || ''} ${order.deliveryInfo?.lastName || ''}`.trim();

    setAddressForm({
      fullName: fullName || '',
      phone: order.address?.phone || order.deliveryDetails?.phone || order.deliveryInfo?.phone || '',
      email: order.address?.email || order.deliveryDetails?.email || order.deliveryInfo?.email || order.email || '',
      address: order.address?.address || order.deliveryDetails?.address || order.deliveryInfo?.street || '',
      city: order.address?.city || order.deliveryDetails?.city || order.deliveryInfo?.city || '',
      state: order.address?.state || order.deliveryDetails?.state || order.deliveryInfo?.state || '',
      pincode: order.address?.pincode || order.deliveryDetails?.pincode || order.deliveryInfo?.zip || '',
    });
    addressFormInitializedRef.current = true;
  }, [isEditingAddress, order]);

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancelOrder = async (payload: { reason: string; customReason: string }) => {
    if (!order) return;

    const cancelOrderId = String(order._id || order.id || '').trim();
    if (!cancelOrderId || ['undefined', 'null'].includes(cancelOrderId.toLowerCase())) {
      const message = 'Unable to cancel order: invalid order identifier.';
      console.error('❌', message, order);
      setError(message);
      setToast({ type: 'error', message });
      setShowCancelModal(false);
      return;
    }

    setCancelling(true);
    setError('');

    try {
      const res = await fetch(buildApiUrl(`/api/orders/${encodeURIComponent(cancelOrderId)}/cancel`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cancelOrderId,
          reason: payload.reason,
          customReason: payload.customReason,
        }),
      });
      const data = await parseResponseBody<any>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      await fetchOrder();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orders-changed'));
      }
      setToast({ type: 'success', message: 'Order cancelled successfully' });
    } catch (err: any) {
      const message = err.message || 'Failed to cancel order';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

    const rows = normalizedItems
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${formatINRCurrency(
            item.price * item.quantity
          )}</td></tr>`
      )
      .join('');

    const invoiceHtml = `
      <html>
      <head>
        <title>Invoice ${order.orderNumber || order._id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { margin-bottom: 4px; }
          table { border-collapse: collapse; width: 100%; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Invoice</h1>
        <p><strong>Order ID:</strong> ${displayOrderId}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
        <p><strong>Status:</strong> ${statusLabelMap[currentStatus] || currentStatus}</p>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <h3 style="margin-top: 16px;">Total: ${formatINRCurrency(order.totalAmount)}</h3>
      </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return;
    popup.document.write(invoiceHtml);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const updateAddress = async () => {
    if (!order) return;

    setIsUpdatingAddress(true);
    setError('');

    try {
      const res = await fetch(buildApiUrl(`/api/orders/${order._id}/address`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressForm }),
      });

      const data = await parseResponseBody<any>(res);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || 'Failed to update address');
      }

      setToast({ type: 'success', message: 'Address updated successfully' });
      setIsEditingAddress(false);
      await fetchOrder({ silent: true });
    } catch (err: any) {
      const message = err?.message || 'Failed to update address';
      setToast({ type: 'error', message });
      setError(message);
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="rounded-xl shadow-sm p-6 bg-white animate-pulse h-32" />
          <div className="rounded-xl shadow-sm p-6 bg-white animate-pulse h-56" />
          <div className="rounded-xl shadow-sm p-6 bg-white animate-pulse h-56" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">Order not found</p>
          <p className="text-gray-500 mb-4">{error || 'Unable to load order details.'}</p>
          <Link href="/account/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-gray-500">
            <ol className="hidden items-center gap-2 sm:flex">
              <li>
                <Link href="/" className="transition-colors duration-200 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/account" className="transition-colors duration-200 hover:text-gray-700">
                  Account
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/account/orders" className="transition-colors duration-200 hover:text-gray-700">
                  Orders
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-black">Order Details</li>
            </ol>

            <ol className="flex items-center gap-2 sm:hidden">
              <li>
                <Link href="/" className="transition-colors duration-200 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/account/orders" className="transition-colors duration-200 hover:text-gray-700">
                  Orders
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-black">Details</li>
            </ol>
          </nav>

          <button
            type="button"
            onClick={() => safePush('/account/orders')}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-gray-100 sm:w-auto sm:justify-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </button>

          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Package className="h-6 w-6 text-gray-700" />
            Order Details
          </h1>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-semibold text-gray-900">{displayOrderId}</p>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">Payment: {paymentStatusLabel}</p>
              <p className="text-sm text-gray-500 mt-1">Method: {paymentMethodLabel}</p>
              {refundStatusLabel && <p className="text-sm text-gray-500 mt-1">Refund: {refundStatusLabel}</p>}
            </div>

            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                statusColorMap[currentStatus] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {statusLabelMap[currentStatus] || currentStatus}
            </span>
          </div>
        </section>

        <section id="timeline" className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Timeline</h2>
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const done = idx <= statusIndex && currentStatus !== 'Cancelled' && !isCancellationRequested;
              const isCurrentCancelled = currentStatus === 'Cancelled' && step === 'Ordered';

              return (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-4 w-4 rounded-full mt-1 ${
                        done || isCurrentCancelled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    {idx < steps.length - 1 && <span className="w-0.5 h-8 bg-gray-200" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${done ? 'text-green-700' : 'text-gray-500'}`}>
                      {statusLabelMap[step] || step}
                    </p>
                    <p className="text-xs text-gray-400">{done ? 'Completed' : 'Pending'}</p>
                  </div>
                </div>
              );
            })}
            {isCancellationRequested && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Cancellation Requested</p>
                <p className="mt-1">Your cancellation request has been sent to TN Automation.</p>
                {paymentMethodLabel === 'Online' ? (
                  <p className="mt-1">Refund: Waiting for cancellation approval</p>
                ) : (
                  <p className="mt-1">No payment has been collected.</p>
                )}
              </div>
            )}
            {currentStatus === 'Cancelled' && !isCancellationRequested && (
              <div className="text-sm text-red-600 font-medium">Order has been cancelled.</div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Delivery Details</h2>
            {currentStatus === 'Ordered' && (
              <button
                type="button"
                disabled={isUpdatingAddress}
                onClick={() => {
                  setIsEditingAddress((prev) => {
                    const next = !prev;
                    if (next) {
                      addressFormInitializedRef.current = false;
                    }
                    return next;
                  });
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Edit Address
              </button>
            )}
          </div>
          {isEditingAddress && isEditable ? (
            <div className="space-y-3">
              <input
                value={addressForm.fullName}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Full Name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={addressForm.phone}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={addressForm.email}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                value={addressForm.address}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Address"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={3}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Pincode"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={updateAddress} disabled={isUpdatingAddress}>
                  {isUpdatingAddress ? 'Saving...' : 'Save Address'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingAddress(false)}
                  disabled={isUpdatingAddress}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-sm text-gray-700">
              <p className="font-medium flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {displayDeliveryName}
              </p>
              <p><strong>Email:</strong> {displayDeliveryEmail}</p>
              <p>{displayDeliveryAddress}</p>
              <p><strong>City:</strong> {displayDeliveryCity}</p>
              <p><strong>State:</strong> {displayDeliveryState}</p>
              <p><strong>Pincode:</strong> {displayDeliveryPincode}</p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {displayDeliveryPhone}
              </p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Products</h2>
          <div className="space-y-3">
            {normalizedItems.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {item.image ? (
                      <img src={getSafeImageSrc(item.image, '/products/default.jpg')} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatINRCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatINRCurrency(order.totalAmount)}</span>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap gap-2">
            {canCancel && !isCancellationRequested && (
              <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
                <>
                  <Ban className="w-4 h-4 mr-1.5" />
                  Cancel Order
                </>
              </Button>
            )}
            {isCancellationRequested && (
              <Button variant="outline" disabled>
                <Ban className="w-4 h-4 mr-1.5" />
                Cancellation Requested
              </Button>
            )}
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <FileDown className="w-4 h-4 mr-1.5" />
              Download Invoice (PDF)
            </Button>
          </div>
        </section>
      </div>

      <CancelOrderModal
        open={showCancelModal}
        isProcessing={cancelling}
        onOpenChange={(open) => {
          if (!open && !cancelling) setShowCancelModal(false);
        }}
        onConfirm={handleConfirmCancelOrder}
      />

      {toast && (
        <div
          className={`fixed bottom-5 right-5 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
