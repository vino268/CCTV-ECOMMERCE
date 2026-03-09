'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getUserId(): string | null {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      return user._id || null;
    }
  } catch {}
  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load cart from MongoDB on mount (if user is logged in)
  const loadCart = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setMounted(true);
      return;
    }

    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const items = await res.json();
        const mapped: CartItem[] = items.map((item: any) => ({
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
  }, []);

  useEffect(() => {
    loadCart();

    // Reload cart when user logs in/out
    const handleAuthChange = () => {
      loadCart();
    };
    window.addEventListener('user-auth-change', handleAuthChange);
    return () => window.removeEventListener('user-auth-change', handleAuthChange);
  }, [loadCart]);

  const addToCart = (product: Product, quantity: number) => {
    const pid = product._id || product.id;
    const userId = getUserId();

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === pid);

      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === pid
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevCart,
        {
          productId: pid,
          quantity,
          product,
        },
      ];
    });

    // Sync to MongoDB
    if (userId) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: pid,
          quantity,
          product: {
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            inStock: product.inStock,
          },
        }),
      }).catch((err) => console.error('Error syncing cart add:', err));
    }
  };

  const removeFromCart = (productId: string) => {
    const userId = getUserId();

    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));

    // Sync to MongoDB
    if (userId) {
      fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity: 0 }),
      }).catch((err) => console.error('Error syncing cart remove:', err));
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const userId = getUserId();

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );

    // Sync to MongoDB
    if (userId) {
      fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity }),
      }).catch((err) => console.error('Error syncing cart update:', err));
    }
  };

  const clearCart = () => {
    const userId = getUserId();

    setCart([]);

    // Sync to MongoDB
    if (userId) {
      fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      }).catch((err) => console.error('Error syncing cart clear:', err));
    }
  };

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
        updateQuantity,
        clearCart,
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
