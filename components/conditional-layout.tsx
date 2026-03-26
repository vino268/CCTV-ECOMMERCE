'use client';

import { usePathname } from 'next/navigation';
import { RootNavbar } from '@/components/root-navbar';
import { RootFooter } from '@/components/root-footer';
import { AdminAccessTriggers } from '@/components/admin-access-triggers';

const HIDDEN_LAYOUT_ROUTES: string[] = [];
const HIDDEN_FOOTER_ROUTES = ['/login', '/signup'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideLayout = HIDDEN_LAYOUT_ROUTES.includes(pathname);
  const hideFooter = hideLayout || HIDDEN_FOOTER_ROUTES.includes(pathname);
  const mainSpacingClass = hideLayout ? '' : 'pt-[72px]';

  return (
    <>
      <AdminAccessTriggers />
      {!hideLayout && <RootNavbar />}
      <main className={`flex-1 ${mainSpacingClass}`}>{children}</main>
      {!hideFooter && <RootFooter />}
    </>
  );
}
