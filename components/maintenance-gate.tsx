'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type MaintenanceResponse = {
  maintenanceMode?: {
    enabled?: boolean;
  };
};

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadMaintenanceMode = async () => {
      try {
        const res = await fetch('/api/admin/settings?scope=public', {
          cache: 'no-store',
        });

        if (!res.ok) {
          setLoaded(true);
          return;
        }

        const data: MaintenanceResponse = await res.json();
        setEnabled(Boolean(data?.maintenanceMode?.enabled));
      } catch (_error) {
        // Fail open to avoid blocking storefront on transient errors.
      } finally {
        setLoaded(true);
      }
    };

    loadMaintenanceMode();
  }, []);

  const bypassMaintenance = pathname?.startsWith('/admin');

  if (bypassMaintenance || !enabled || !loaded) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-slate-900">We&apos;ll Be Back Soon</h1>
        <p className="mt-3 text-slate-600">
          Our store is currently in maintenance mode. Please check back shortly.
        </p>
      </div>
    </div>
  );
}
