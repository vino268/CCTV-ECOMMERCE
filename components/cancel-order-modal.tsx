'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelOrderModalProps {
  open: boolean;
  isProcessing?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  processingText?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { reason: string; customReason: string }) => void;
}

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price',
  'Want to change product',
  'Want to change delivery address',
  'Delivery taking too long',
  'Other',
];

export default function CancelOrderModal({
  open,
  isProcessing = false,
  title = 'Cancel Order',
  description = 'Are you sure you want to cancel this order? This action cannot be undone.',
  confirmText = 'Confirm',
  processingText = 'Processing...',
  onOpenChange,
  onConfirm,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedReason(CANCEL_REASONS[0]);
      setCustomReason('');
    }
  }, [open]);

  const isCustomReason = selectedReason === 'Other';

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isProcessing && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            if (isProcessing) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (isProcessing) event.preventDefault();
          }}
          className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">
              {title}
            </DialogPrimitive.Title>
          </div>

          <DialogPrimitive.Description className="mt-3 text-sm text-gray-600">
            {description}
          </DialogPrimitive.Description>

          <div className="mt-5 space-y-3">
            <p className="text-sm font-medium text-gray-800">Why do you want to cancel this order?</p>
            <div className="grid gap-2">
              {CANCEL_REASONS.map((reason) => (
                <label key={reason} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {isCustomReason && (
              <textarea
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Tell us more..."
                className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm({ reason: selectedReason, customReason: isCustomReason ? customReason : '' })}
              disabled={isProcessing}
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {processingText}
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
