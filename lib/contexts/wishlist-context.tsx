'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/contexts/auth-context';

export interface WishlistItem {
  _id: string;
  userId: string;
  productId: Product | null;
  createdAt?: string;
  updatedAt?: string;
}

type ToggleWishlistResult = {
  ok: boolean;
  added: boolean;
  message?: string;
};

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<ToggleWishlistResult>;
  refreshWishlist: () => Promise<void>;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function normalizeObjectId(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^[a-fA-F0-9]{24}$/.test(trimmed) ? trimmed : null;
  }

  if (typeof value === 'object') {
    const candidate = (value as { $oid?: unknown }).$oid;
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      return /^[a-fA-F0-9]{24}$/.test(trimmed) ? trimmed : null;
    }
  }

  return null;
}

function getProductId(product: Product) {
  return String(product._id || '');
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = normalizeObjectId(user?._id);

  const normalizeWishlistItem = (raw: any): WishlistItem => {
    const productRaw = raw?.productId;
    const product = productRaw
      ? {
          ...productRaw,
          id: String(productRaw._id || ''),
          _id: String(productRaw._id || ''),
          specs: productRaw.specs || {},
        }
      : null;

    return {
      _id: String(raw?._id || ''),
      userId: String(raw?.userId || ''),
      productId: product,
      createdAt: raw?.createdAt,
      updatedAt: raw?.updatedAt,
    };
  };

  const refreshWishlist = useCallback(async () => {
    if (!userId) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/wishlist/${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.warn('Wishlist fetch non-OK response:', res.status, body);
        setWishlist([]);
        return;
      }

      const data = await res.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('[wishlist][context] fetched payload:', data);
      }

      const rawWishlist = Array.isArray(data?.wishlist)
        ? data.wishlist
        : Array.isArray(data?.items)
          ? data.items.map((item: any) => ({ _id: item?._id || item?.id, userId, productId: item }))
          : [];

      const normalized: WishlistItem[] = rawWishlist.map(normalizeWishlistItem);

      if (process.env.NODE_ENV !== 'production') {
        normalized.forEach((entry) => {
          if (!entry.productId) {
            console.warn('[wishlist][context] productId is null:', entry._id);
          }
        });
      }

      setWishlist(normalized);
    } catch (error) {
      console.error('Wishlist fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshWishlist();

    const handleAuthChange = () => {
      setLoading(true);
      refreshWishlist();
    };

    window.addEventListener('user-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('user-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshWishlist]);

  const wishlistIds = useMemo(() => {
    return new Set(
      wishlist
        .map((entry) => entry.productId)
        .filter(Boolean)
        .map((product) => getProductId(product as Product))
    );
  }, [wishlist]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.has(String(productId)),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!userId) {
      return { ok: false, added: false, message: 'Please login to use wishlist' };
    }

    const pid = getProductId(product);
    if (!pid) {
      return { ok: false, added: false, message: 'Invalid product' };
    }

    const exists = wishlistIds.has(pid);

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId: pid }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle');
      }

      const data = await res.json();
      const added = Boolean(data?.added);
      await refreshWishlist();
      return {
        ok: true,
        added,
        message: added ? 'Added to wishlist' : 'Removed from wishlist',
      };
    } catch (error) {
      console.error('Wishlist toggle failed:', error);
      return { ok: false, added: false, message: 'Failed to update wishlist' };
    }
  }, [wishlistIds, refreshWishlist, userId]);

  const getWishlistCount = useCallback(
    () => wishlist.filter((entry) => Boolean(entry.productId)).length,
    [wishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isWishlisted,
        toggleWishlist,
        refreshWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
