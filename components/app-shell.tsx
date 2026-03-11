'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { WhatsAppSupport } from '@/components/whatsapp-support';
import { MaintenanceGate } from '@/components/maintenance-gate';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <MaintenanceGate>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppSupport />
    </MaintenanceGate>
  );
}
