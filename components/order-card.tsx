'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Ban, Eye, Loader2, MessageCircle, PackageCheck, PhoneCall, RefreshCw } from 'lucide-react';
import { formatINRCurrency } from '@/lib/currency';

interface OrderProduct {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  image?: string;
  productImage?: string;
}

export interface AccountOrder {
  _id: string;
  id?: string;
  orderNumber: string;
  email: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentStatus?: string;
  orderStatus?: string;
  trackingStatus?: string;
  status?: string;
  cancelRequested?: boolean;
  createdAt: string;
}

interface OrderCardProps {
  order: AccountOrder;
  isCancelling: boolean;
  onCancel: (orderId: string, mode: 'cancel' | 'request') => void;
}

const timelineSteps = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusBadgeStyles: Record<string, string> = {
  'Order Placed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Packed: 'bg-blue-100 text-blue-800 border-blue-200',
  Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Out for Delivery': 'bg-orange-100 text-orange-800 border-orange-200',
  Delivered: 'bg-green-100 text-green-800 border-green-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
};

function normalizeOrderStatus(raw?: string) {
  const value = String(raw || '').trim().toLowerCase();
  const map: Record<string, string> = {
    ordered: 'Order Placed',
    pending: 'Order Placed',
    confirmed: 'Packed',
    packed: 'Packed',
    shipped: 'Shipped',
    outfordelivery: 'Out for Delivery',
    'out for delivery': 'Out for Delivery',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[value] || 'Order Placed';
}

function getTimelineActiveStep(status: string) {
  switch (status) {
    case 'Order Placed':
      return 0;
    case 'Packed':
      return 1;
    case 'Shipped':
      return 2;
    case 'Out for Delivery':
      return 3;
    case 'Delivered':
      return 4;
    default:
      return -1;
  }
}

export default function OrderCard({ order, isCancelling, onCancel }: OrderCardProps) {
  const router = useRouter();
  const [navigatingAction, setNavigatingAction] = useState<'view' | 'track' | null>(null);

  const normalizedStatus = normalizeOrderStatus(order.status || order.trackingStatus || order.orderStatus);
  const isOrderPlaced = normalizedStatus === 'Order Placed';
  const isPacked = normalizedStatus === 'Packed';
  const isAfterPacked =
    normalizedStatus === 'Shipped' ||
    normalizedStatus === 'Out for Delivery' ||
    normalizedStatus === 'Delivered';

  const canDirectCancel = isOrderPlaced;
  const canRequestCancel = isPacked && !order.cancelRequested;
  const showDisabledCancel = isAfterPacked;
  const showSupportActions = !isOrderPlaced;

  const activeTimelineIndex = getTimelineActiveStep(normalizedStatus);
  const orderId = order._id || order.id;

  const firstProduct = order.products?.[0];
  const placeholderImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="16">No Image</text></svg>';
  const productImage = firstProduct?.productImage || firstProduct?.image || placeholderImage;
  const itemCount = (order.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0);

  const handleViewDetails = () => {
    if (!orderId) return;
    setNavigatingAction('view');
    router.push(`/account/orders/${orderId}`);
  };

  const handleTrackOrder = () => {
    if (!orderId) return;
    setNavigatingAction('track');
    router.push(`/account/orders/${orderId}?section=timeline`);
  };

  return (
    <article className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="grid gap-4 md:grid-cols-[120px_1fr]">
        <div className="h-28 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 md:h-28 md:w-[120px]">
          <img
            src={productImage}
            alt={firstProduct?.productName || 'Ordered product'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
                {firstProduct?.productName || 'Product'}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {itemCount} item{itemCount === 1 ? '' : 's'} | Order ID: {order.orderNumber || order._id}
              </p>
              <p className="text-xs text-gray-500">
                Ordered on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatINRCurrency(order.totalAmount)}</p>
              <p className="text-xs text-gray-500">Payment: {order.paymentStatus || 'Unpaid'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-300 ${
                statusBadgeStyles[normalizedStatus] || 'border-gray-200 bg-gray-100 text-gray-700'
              }`}
            >
              {normalizedStatus}
            </span>
          </div>

          {normalizedStatus !== 'Cancelled' ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <div className="grid grid-cols-5 gap-2">
                {timelineSteps.map((step, index) => {
                  const done = index <= activeTimelineIndex;
                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <span
                        className={`mb-1 h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                          done ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                      <span
                        className={`text-[10px] leading-tight sm:text-[11px] ${
                          done ? 'font-medium text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              This order has been cancelled.
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 hover:text-blue-700"
              onClick={handleViewDetails}
              disabled={!orderId || navigatingAction !== null}
            >
              {navigatingAction === 'view' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View Details
                </>
              )}
            </Button>

            {canDirectCancel && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => onCancel(order._id, 'cancel')}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Cancel Order
                  </>
                )}
              </Button>
            )}

            {canRequestCancel && (
              <Button
                size="sm"
                className="gap-1.5 bg-yellow-500 text-white hover:bg-yellow-600"
                onClick={() => onCancel(order._id, 'request')}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Request Cancel
                  </>
                )}
              </Button>
            )}

            {order.cancelRequested && normalizedStatus !== 'Cancelled' && (
              <span className="inline-flex items-center rounded-md bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Cancel Requested
              </span>
            )}

            {showDisabledCancel && (
              <Button
                size="sm"
                className="gap-1.5 bg-gray-300 text-gray-700 hover:bg-gray-300"
                disabled
              >
                <Ban className="h-4 w-4" />
                Cancel Unavailable
              </Button>
            )}

            {firstProduct?.productId && (
              <Link href={`/products/${firstProduct.productId}`}>
                <Button size="sm" className="gap-1.5 bg-slate-900 text-white hover:bg-black">
                  <RefreshCw className="h-4 w-4" />
                  Reorder
                </Button>
              </Link>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-slate-700 hover:text-blue-700"
              onClick={handleTrackOrder}
              disabled={!orderId || navigatingAction !== null}
            >
              {navigatingAction === 'track' ? (
                <>

            {showSupportActions && (
              <>
                <a href="tel:+919999999999">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
                    type="button"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Call Support
                  </Button>
                </a>

                <a
                  href={`https://wa.me/919999999999?text=${encodeURIComponent(
                    `Hi, I need support for order ${order.orderNumber || order._id}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-500 text-white hover:bg-green-600"
                    type="button"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Support
                  </Button>
                </a>
              </>
            )}
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  Track Order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}