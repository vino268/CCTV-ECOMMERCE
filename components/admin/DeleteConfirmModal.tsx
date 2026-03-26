'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  open,
  title = 'Confirm Deletion',
  message,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsVisible(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className={`w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <p className="mb-6 text-sm text-gray-600">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
