'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from '@/lib/contexts/auth-context';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  isInCart: (productId: string) => boolean;
  toggleCartItem: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isCartActionPending: (productId: string) => boolean;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?._id || null;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<Record<string, boolean>>({});

  // Load cart from MongoDB on mount (if user is logged in)
  const loadCart = useCallback(async () => {
    if (!userId) {
      setCart([]);
      setMounted(true);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const items = await res.json();
        const mapped: CartItem[] = (Array.isArray(items) ? items : []).map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          product: item.product || undefined,
        }));
        setCart(mapped);
      }
    } catch (err) {
      console.error('Error loading cart from API:', err);
    } finally {
      setMounted(true);
    }
  }, [userId]);

  useEffect(() => {
    loadCart();

    // Reload cart when user logs in/out
    const handleAuthChange = () => {
      loadCart();
    };
    window.addEventListener('user-auth-change', handleAuthChange);
    return () => window.removeEventListener('user-auth-change', handleAuthChange);
  }, [loadCart]);

  const markPending = (productId: string, pending: boolean) => {
    setPendingProductIds((prev) => {
      if (pending) return { ...prev, [productId]: true };
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const addToCart = async (product: Product, quantity: number) => {
    const pid = product._id ?? '';
    if (!pid) return;

    if (isInCart(pid)) {
      return;
    }

    markPending(pid, true);
    try {
      const optimisticItem: CartItem = {
        productId: pid,
        quantity: Math.max(1, quantity || 1),
        product,
      };

      setCart((prevCart) => {
        if (prevCart.some((item) => item.productId === pid)) return prevCart;
        return [...prevCart, optimisticItem];
      });

      if (!userId) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: pid,
          quantity: Math.max(1, quantity || 1),
          product: {
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            inStock: product.inStock,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error syncing cart add:', err);
      setCart((prevCart) => {
        return prevCart.filter((item) => item.productId !== pid);
      });
    } finally {
      markPending(pid, false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!productId) return;

    markPending(productId, true);

    const previousCart = cart;

    setCart((prevCart) => {
      return prevCart.filter((item) => item.productId !== productId);
    });

    try {
      if (!userId) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/${encodeURIComponent(productId)}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to remove from cart');
      }
    } catch (err) {
      console.error('Error syncing cart remove:', err);
      setCart(previousCart);
    } finally {
      markPending(productId, false);
    }
  };

  const isInCart = (productId: string) => {
    return cart.some((item) => item.productId === productId);
  };

  const toggleCartItem = async (product: Product, quantity = 1) => {
    const pid = product._id ?? '';
    if (!pid || pendingProductIds[pid]) return;

    if (isInCart(pid)) {
      await removeFromCart(pid);
      return;
    }
    await addToCart(product, quantity);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const safeQuantity = Math.max(1, quantity);

    if (!productId) return;
    markPending(productId, true);

    const previousCart = cart;

    setCart((prevCart) => {
      return prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity: safeQuantity } : item
      );
    });

    try {
      if (!userId) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity: safeQuantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update cart quantity');
      }
    } catch (err) {
      console.error('Error syncing cart update:', err);
      setCart(previousCart);
    } finally {
      markPending(productId, false);
    }
  };

  const clearCart = async () => {
    const previousCart = cart;

    setCart([]);

    try {
      if (!userId) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to clear cart');
      }
    } catch (err) {
      console.error('Error syncing cart clear:', err);
      setCart(previousCart);
    }
  };

  const isCartActionPending = (productId: string) => Boolean(pendingProductIds[productId]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        isInCart,
        toggleCartItem,
        updateQuantity,
        clearCart,
        isCartActionPending,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
