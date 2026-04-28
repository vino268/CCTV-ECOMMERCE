'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
  return target.isContentEditable;
}

export function AdminAccessTriggers() {
  // Use same-origin relative paths for production
  const API_BASE = '';
  const router = useRouter();
  const pathname = usePathname();

  const forceAdminLogin = async () => {
    try {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors and still proceed to login.
    }

    router.push('/admin/login');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key !== 'a') return;
      if (pathname === '/admin/login') return;

      void forceAdminLogin();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pathname]);

  return null;
}
