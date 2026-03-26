'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2, LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
  open: boolean;
  isProcessing?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  open,
  isProcessing = false,
  onOpenChange,
  onConfirm,
}: LogoutConfirmModalProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isProcessing && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
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
              <LogOut className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">
              Confirm Logout
            </DialogPrimitive.Title>
          </div>

          <DialogPrimitive.Description className="mt-3 text-sm text-gray-600">
            Are you sure you want to sign out?
          </DialogPrimitive.Description>

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
              onClick={onConfirm}
              disabled={isProcessing}
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
