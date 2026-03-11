'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

/**
 * Conditionally renders the public website chrome (Navbar + Footer) based on
 * the current route. Admin routes under /admin are rendered without the user
 * navbar and footer — they receive their own layout via app/admin/layout.tsx.
 */
export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  if (isAdminPath) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
