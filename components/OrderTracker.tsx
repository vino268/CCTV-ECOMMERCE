'use client';

import { Package, CheckCircle2, Truck, MapPin, CircleDot, XCircle } from 'lucide-react';

interface OrderTrackerProps {
  trackingStatus: string;
  createdAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

const STEPS = [
  { key: 'Ordered', label: 'Ordered', icon: Package },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'OutForDelivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'Delivered', label: 'Delivered', icon: CircleDot },
];

const STATUS_INDEX: Record<string, number> = {
  Ordered: 0,
  Confirmed: 1,
  Shipped: 2,
  OutForDelivery: 3,
  Delivered: 4,
};

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderTracker({
  trackingStatus,
  createdAt,
  confirmedAt,
  shippedAt,
  outForDeliveryAt,
  deliveredAt,
  cancelledAt,
}: OrderTrackerProps) {
  const isCancelled = trackingStatus === 'Cancelled';
  const currentIndex = STATUS_INDEX[trackingStatus] ?? -1;

  const timestamps: Record<string, string | undefined> = {
    Ordered: createdAt,
    Confirmed: confirmedAt,
    Shipped: shippedAt,
    OutForDelivery: outForDeliveryAt,
    Delivered: deliveredAt,
  };

  if (isCancelled) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
            {cancelledAt && (
              <p className="text-sm text-red-600 dark:text-red-500">
                Cancelled on {formatDate(cancelledAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determine the header message
  const headerMessages: Record<string, string> = {
    Ordered: 'Your order has been placed',
    Confirmed: 'Your order has been confirmed',
    Shipped: 'Your package is on the way 🚚',
    OutForDelivery: 'Your package is out for delivery 📦',
    Delivered: 'Your package has been delivered ✅',
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-lg font-semibold text-foreground">
          {headerMessages[trackingStatus] || 'Order status unknown'}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;
          const Icon = step.icon;
          const date = timestamps[step.key];

          return (
            <div key={step.key} className="flex items-start gap-4 relative">
              {/* Vertical line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-full -translate-x-1/2 ${
                    index < currentIndex
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}

              {/* Icon circle */}
              <div
                className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? isActive
                      ? 'bg-green-500 border-green-500 text-white ring-4 ring-green-100 dark:ring-green-900'
                      : 'bg-green-500 border-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Icon className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-8 ${index === STEPS.length - 1 ? 'pb-0' : ''}`}>
                <p
                  className={`font-medium ${
                    isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  } ${isActive ? 'text-green-600 dark:text-green-400' : ''}`}
                >
                  {step.label}
                  {isCompleted && (
                    <span className="ml-2 text-green-500">✓</span>
                  )}
                </p>
                {isCompleted && date && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(date)}
                  </p>
                )}
                {!isCompleted && (
                  <p className="text-sm text-muted-foreground/50 mt-0.5">
                    Pending
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
