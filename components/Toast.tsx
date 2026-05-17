"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function Toast() {
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      setToast(e.detail);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setToast(null), 200); // Wait for exit animation
      }, 3000);
    };

    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, []);

  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const title = isSuccess ? "Success" : "Error";
  const message = toast.message || '';
  if (!message || message.trim() === '' || message === 'Error' || message === 'error') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[100]">
      <div
        className={`flex w-full max-w-sm items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/5 transition-all duration-200 ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-4.5 w-4.5" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}
