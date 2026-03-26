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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key !== 'a') return;
      if (pathname === '/admin/login') return;

      router.push('/admin/login');
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [router, pathname]);

  return null;
}
