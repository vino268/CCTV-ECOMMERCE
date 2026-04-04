'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Loader2,
  Package,
  Pencil,
  Phone,
  Save,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { getSafeImageSrc } from '@/lib/product-image';

interface OrderProduct {
  productId: string;
  productName: string;
  productPrice: number;
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

interface Order {
  _id: string;
  orderNumber: string;
  email: string;
  products: OrderProduct[];
  totalAmount: number;
  orderStatus: string;
  trackingStatus: string;
  createdAt: string;
  deliveryInfo: DeliveryInfo;
}

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

const steps = ['Ordered', 'Confirmed', 'Shipped', 'OutForDelivery', 'Delivered'];

const statusColorMap: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ordered: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  OutForDelivery: 'bg-orange-100 text-orange-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const statusLabelMap: Record<string, string> = {
  Pending: 'Pending',
  Ordered: 'Ordered',
  Confirmed: 'Confirmed',
  Shipped: 'Shipped',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

function normalizeStatus(status?: string) {
  if (!status) return 'Ordered';
  return statusLabelMap[status] ? status : 'Ordered';
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

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${params.id}`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setOrder(data);
      setAddressForm({
        firstName: data.deliveryInfo?.firstName || '',
        lastName: data.deliveryInfo?.lastName || '',
        phone: data.deliveryInfo?.phone || '',
        street: data.deliveryInfo?.street || '',
        city: data.deliveryInfo?.city || '',
        state: data.deliveryInfo?.state || '',
        zip: data.deliveryInfo?.zip || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/account/orders/${params.id}`);
      return;
    }

    fetchOrder();
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
    () => normalizeStatus(order?.trackingStatus || order?.orderStatus),
    [order]
  );

  const statusIndex = steps.indexOf(currentStatus);
  const canCancel = currentStatus === 'Ordered' || currentStatus === 'Confirmed';
  const canEditAddress = currentStatus === 'Ordered' || currentStatus === 'Confirmed';

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!order) return;

    setCancelling(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/cancel/${order._id}`, { method: 'PUT' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      await fetchOrder();
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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSavingAddress(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/${order._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryInfo: addressForm, phone: addressForm.phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update delivery details');
      }

      setShowAddressModal(false);
      await fetchOrder();
      setToast({ type: 'success', message: 'Address updated successfully' });
    } catch (err: any) {
      setError(err.message || 'Failed to update address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

    const rows = order.products
      .map(
        (item) =>
          `<tr><td>${item.productName}</td><td>${item.quantity}</td><td>${formatINRCurrency(
            item.productPrice * item.quantity
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
        <p><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
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
            onClick={() => router.push('/account/orders')}
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
              <p className="font-semibold text-gray-900">{order.orderNumber || order._id}</p>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
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
              const done = idx <= statusIndex && currentStatus !== 'Cancelled';
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
            {currentStatus === 'Cancelled' && (
              <div className="text-sm text-red-600 font-medium">Order has been cancelled.</div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Delivery Details</h2>
            {canEditAddress && (
              <Button variant="outline" size="sm" onClick={() => setShowAddressModal(true)}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit Address
              </Button>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <p className="font-medium flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {order.deliveryInfo?.firstName} {order.deliveryInfo?.lastName}
            </p>
            <p>{order.deliveryInfo?.street}</p>
            <p>
              {order.deliveryInfo?.city}, {order.deliveryInfo?.state} {order.deliveryInfo?.zip}
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              {order.deliveryInfo?.phone}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Products</h2>
          <div className="space-y-3">
            {order.products.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {item.image ? (
                      <img src={getSafeImageSrc(item.image, '/products/default.jpg')} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatINRCurrency(item.productPrice * item.quantity)}
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
            {canCancel && (
              <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
                <>
                  <Ban className="w-4 h-4 mr-1.5" />
                  Cancel Order
                </>
              </Button>
            )}
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <FileDown className="w-4 h-4 mr-1.5" />
              Download Invoice (PDF)
            </Button>
          </div>
        </section>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Delivery Address</h3>
              <button
                type="button"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowAddressModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="First name"
                  value={addressForm.firstName}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Last name"
                  value={addressForm.lastName}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Phone"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Street"
                value={addressForm.street}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                  required
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="ZIP"
                value={addressForm.zip}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, zip: e.target.value }))}
                required
              />

              <div className="pt-2 flex gap-2">
                <Button type="submit" disabled={savingAddress}>
                  {savingAddress ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" />
                      Save Address
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddressModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
