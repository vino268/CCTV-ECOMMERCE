"use client";
import { usePathname } from 'next/navigation';
import { RootNavbar } from '@/components/root-navbar';
import { RootFooter } from '@/components/root-footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter =
    pathname.startsWith('/account') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/admin');
  return (
    <>
      {!hideFooter && <RootNavbar />}
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <RootFooter />}
    </>
  );
}