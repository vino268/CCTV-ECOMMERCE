'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import LogoutConfirmModal from '@/components/logout-confirm-modal';
import { useAuth } from '@/lib/contexts/auth-context';
import { toProfileImageUrl } from '@/lib/profile-image-url';

function getInitial(name?: string, email?: string) {
  return (name || email || 'U').charAt(0).toUpperCase();
}

export function AccountMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-menu')) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await logout();
    setOpen(false);
    setShowLogoutModal(false);
    router.push('/');
    setIsLoggingOut(false);
  };

  const handleOpenLogoutModal = () => {
    setOpen(false);
    setShowLogoutModal(true);
  };

  useEffect(() => {
    setAvatarError(false);
  }, [user?.profileImage, user?.avatar]);

  // Not logged in — show Login / Signup buttons
  if (loading) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" aria-hidden="true" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <User className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">Login</span>
          <span className="sr-only sm:hidden">Login</span>
        </Link>
      </div>
    );
  }

  // Logged in — show avatar button + dropdown
  const userProfileImage = String(user.profileImage || user.avatar || '').trim();
  const avatarSrc = toProfileImageUrl(userProfileImage, user.avatarVersion);
  const initial = getInitial(user.name, user.email);

  return (
    <div className="relative profile-menu">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg transition-colors"
      >
        {!!avatarSrc && !avatarError ? (
          <Image
            src={avatarSrc}
            alt="profile"
            width={40}
            height={40}
            priority
            unoptimized
            className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 bg-white"
          />
        ) : (
          <div className="h-10 w-10 rounded-full border-2 border-gray-200 bg-[#2563eb] text-white flex items-center justify-center text-sm font-bold uppercase">
            {initial}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {open && (
        <div className="absolute top-14 right-0 sm:right-0 left-1/2 sm:left-auto -translate-x-1/2 sm:translate-x-0 w-[92vw] sm:w-56 max-w-[320px] rounded-xl shadow-lg border bg-white p-2 z-[9999]">
          <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 border-l border-t" />
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
            <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <div className="flex flex-col">
            <Link
              href="/account"
              prefetch={true}
              onClick={() => setOpen(false)}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg cursor-pointer text-left text-sm text-gray-700"
            >
              My Profile
            </Link>

            <Link
              href="/account/orders"
              prefetch={true}
              onClick={() => setOpen(false)}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg cursor-pointer text-left text-sm text-gray-700"
            >
              My Orders
            </Link>

            <Link
              href="/account/address"
              prefetch={true}
              onClick={() => setOpen(false)}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg cursor-pointer text-left text-sm text-gray-700"
            >
              Saved Addresses
            </Link>

            <button
              onClick={handleOpenLogoutModal}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg cursor-pointer text-left text-sm text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <LogoutConfirmModal
        open={showLogoutModal}
        isProcessing={isLoggingOut}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isLoggingOut) setShowLogoutModal(false);
        }}
        onConfirm={handleSignOut}
      />
    </div>
  );
}
