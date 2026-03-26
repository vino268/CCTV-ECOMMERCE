'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { ToastData } from '@/hooks/use-toast';

interface ToastNotificationProps {
  toast: ToastData | null;
}

export default function ToastNotification({ toast }: ToastNotificationProps) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[100]">
      <div
        className={`flex max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-lg transition-all ${
          isSuccess ? 'bg-green-600' : 'bg-red-600'
        }`}
        role="status"
        aria-live="polite"
      >
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
