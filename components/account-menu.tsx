'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Package, MapPin, UserCircle } from 'lucide-react';

interface UserData {
  _id?: string;
  name: string;
  email: string;
  role?: string;
}

export function AccountMenu() {
  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }

    const handleStorageChange = () => {
      const updated = localStorage.getItem('user');
      setUser(updated ? JSON.parse(updated) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-auth-change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-auth-change', handleStorageChange);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setUser(null);
    setOpen(false);
    window.dispatchEvent(new Event('user-auth-change'));
    router.push('/account');
  };

  // Not logged in — show icon link to /account
  if (!user) {
    return (
      <Link
        href="/account"
        className="p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <User className="w-5 h-5 text-foreground" />
      </Link>
    );
  }

  // Logged in — show avatar button + dropdown
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card/95 glass border border-border/60 rounded-xl shadow-xl py-1 z-50">
          {/* User header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <UserCircle className="w-4 h-4 text-muted-foreground" />
              Your Account
            </Link>

            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile Information
            </Link>

            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Package className="w-4 h-4 text-muted-foreground" />
              My Orders
            </Link>

            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <MapPin className="w-4 h-4 text-muted-foreground" />
              My Address
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-muted transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
