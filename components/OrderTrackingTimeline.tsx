'use client';

import { Package, CheckCircle2, Truck, MapPin, CircleDot, XCircle } from 'lucide-react';

interface OrderTrackingTimelineProps {
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

export function OrderTrackingTimeline({
  trackingStatus,
  createdAt,
  confirmedAt,
  shippedAt,
  outForDeliveryAt,
  deliveredAt,
  cancelledAt,
}: OrderTrackingTimelineProps) {
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

  return (
    <div className="w-full">
      {/* Horizontal progress bar (desktop) */}
      <div className="hidden sm:block mb-8">
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
          {/* Progress line */}
          <div
            className="absolute top-5 left-0 h-1 bg-green-500 rounded-full transition-all duration-500"
            style={{
              width: currentIndex >= 0
                ? `${(currentIndex / (STEPS.length - 1)) * 100}%`
                : '0%',
            }}
          />

          {STEPS.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isActive = index === currentIndex;
            const Icon = step.icon;
            const date = timestamps[step.key];

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? isActive
                        ? 'bg-green-500 border-green-500 text-white ring-4 ring-green-100 dark:ring-green-900'
                        : 'bg-green-500 border-green-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p
                  className={`mt-2 text-xs font-medium text-center ${
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  } ${isActive ? 'text-green-600 dark:text-green-400' : ''}`}
                >
                  {isCompleted ? '✔' : '⬜'} {step.label}
                </p>
                {isCompleted && date && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 text-center">
                    {formatDate(date)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical timeline (mobile) */}
      <div className="sm:hidden">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;
          const Icon = step.icon;
          const date = timestamps[step.key];

          return (
            <div key={step.key} className="flex items-start gap-3 relative">
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

              {/* Icon */}
              <div
                className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? isActive
                      ? 'bg-green-500 border-green-500 text-white ring-4 ring-green-100 dark:ring-green-900'
                      : 'bg-green-500 border-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className={`pb-6 ${index === STEPS.length - 1 ? 'pb-0' : ''}`}>
                <p
                  className={`font-medium ${
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  } ${isActive ? 'text-green-600 dark:text-green-400' : ''}`}
                >
                  {isCompleted ? '✔' : '⬜'} {step.label}
                </p>
                {isCompleted && date && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(date)}
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
