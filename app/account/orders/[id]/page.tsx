'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OrderTracker } from '@/components/OrderTracker';
import {
  ArrowLeft,
  Package,
  Ban,
  Phone,
  Truck,
  Calendar,
  Hash,
} from 'lucide-react';

interface OrderProduct {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingStatus: string;
  deliveryInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

const statusBadgeColors: Record<string, string> = {
  Ordered: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  OutForDelivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  Ordered: 'Ordered',
  Confirmed: 'Confirmed',
  Shipped: 'Shipped',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);
    } catch {
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/account');
      return;
    }
    fetchOrder();

    // Poll for real-time updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder, router]);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchOrder();
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch {
      alert('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'This order does not exist.'}</p>
          <Link href="/account/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const trackingStatus = order.trackingStatus || order.orderStatus;
  const canCancel = ['Ordered', 'Confirmed'].includes(trackingStatus);
  const isShippedOrBeyond = ['Shipped', 'OutForDelivery', 'Delivered'].includes(trackingStatus);
  const isCancelled = trackingStatus === 'Cancelled';

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/account/orders">
          <Button variant="outline" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Button>
        </Link>

        {/* Order header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              statusBadgeColors[trackingStatus] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[trackingStatus] || trackingStatus}
          </span>
        </div>

        {/* Tracking Card */}
        <Card className="p-6 mb-6">
          <OrderTracker
            trackingStatus={trackingStatus}
            createdAt={order.createdAt}
            confirmedAt={order.confirmedAt}
            shippedAt={order.shippedAt}
            outForDeliveryAt={order.outForDeliveryAt}
            deliveredAt={order.deliveredAt}
            cancelledAt={order.cancelledAt}
          />
        </Card>

        {/* Delivery Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping Details */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Shipping Details
            </h3>
            <div className="space-y-3 text-sm">
              {order.trackingNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tracking:</span>
                  <span className="font-medium text-foreground">{order.trackingNumber}</span>
                </div>
              )}
              {order.estimatedDelivery && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Est. Delivery:</span>
                  <span className="font-medium text-foreground">
                    {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground mb-1">Delivery by</p>
                <p className="font-medium text-foreground">TN Automation</p>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Delivery Address
            </h3>
            {order.deliveryInfo && (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">
                  {order.deliveryInfo.firstName} {order.deliveryInfo.lastName}
                </p>
                <p className="text-muted-foreground">{order.deliveryInfo.street}</p>
                <p className="text-muted-foreground">
                  {order.deliveryInfo.city}, {order.deliveryInfo.state} {order.deliveryInfo.zip}
                </p>
                {order.deliveryInfo.phone && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{order.deliveryInfo.phone}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Items Card */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.products.map((p, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-3 border-b border-border last:border-b-0"
              >
                <div>
                  <Link
                    href={`/products/${p.productId}`}
                    className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {p.productName}
                  </Link>
                  <p className="text-sm text-muted-foreground">Qty: {p.quantity}</p>
                </div>
                <span className="font-semibold text-foreground">
                  ${(p.productPrice * p.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-xl font-bold text-primary">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </Card>

        {/* Action buttons */}
        {!isCancelled && (
          <Card className="p-6">
            {canCancel ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="gap-2"
                >
                  <Ban className="w-4 h-4" />
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </Button>
                <Link href={`/account/orders`}>
                  <Button variant="outline" className="gap-2">
                    Edit Address
                  </Button>
                </Link>
              </div>
            ) : isShippedOrBeyond ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Order already shipped. Contact support for cancellation.
                </p>
                <Button variant="outline" className="gap-2">
                  <Phone className="w-4 h-4" />
                  Request Cancellation
                </Button>
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
