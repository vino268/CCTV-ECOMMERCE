'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteAccountModalProps {
  open: boolean;
  password: string;
  isProcessing?: boolean;
  errorMessage?: string;
  onPasswordChange: (password: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function DeleteAccountModal({
  open,
  password,
  isProcessing = false,
  errorMessage = '',
  onPasswordChange,
  onOpenChange,
  onConfirm,
}: DeleteAccountModalProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isProcessing && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            if (isProcessing) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (isProcessing) event.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-red-100 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <DialogPrimitive.Title className="text-xl font-semibold text-red-600">
              Delete Account
            </DialogPrimitive.Title>
          </div>

          <DialogPrimitive.Description className="mt-2 text-sm text-gray-600">
            This action cannot be undone.
          </DialogPrimitive.Description>

          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <ul className="space-y-1 text-sm text-red-700">
              <li>Deactivate profile access</li>
              <li>Orders history stays for admin tracking</li>
              <li>Wishlist and activity remain archived</li>
              <li>Cannot recover from user side</li>
            </ul>
          </div>

          <div className="mt-5">
            <label htmlFor="delete-account-password" className="mb-2 block text-sm font-medium text-gray-700">
              Confirm your password
            </label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-200"
              disabled={isProcessing}
              required
            />
            {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing || !password.trim()}
              className="inline-flex items-center rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
