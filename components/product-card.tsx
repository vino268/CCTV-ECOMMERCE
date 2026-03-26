'use client';

import { Product } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Check, Heart } from 'lucide-react';
import { useCart } from '@/lib/contexts/cart-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/contexts/wishlist-context';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/lib/contexts/auth-context';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleCartItem, isInCart, isCartActionPending } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isCartBtnAnimating, setIsCartBtnAnimating] = useState(false);
  const [toast, setToast] = useState('');
  const [imageError, setImageError] = useState(false);
  const productId = product._id || product.id;
  const alreadyInCart = isInCart(productId);
  const cartPending = isCartActionPending(productId);
  const wishlisted = isWishlisted(productId);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleAddToCart = async () => {
    if (!product.inStock) return;
    if (cartPending) return;
    setIsCartBtnAnimating(true);
    setTimeout(() => setIsCartBtnAnimating(false), 350);
    await toggleCartItem(product, 1);
    setToast(alreadyInCart ? 'Removed from cart' : 'Item added to cart');
  };

  const handleBuyNow = async () => {
    if (!product.inStock) return;
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    try {
      const res = await fetch('/api/orders/buy-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.orderId) {
        router.push(`/checkout?orderId=${data.orderId}`);
      } else {
        setToast(data?.message || 'Failed to proceed to checkout');
      }
    } catch (error) {
      console.error('Buy now failed:', error);
      setToast('Failed to proceed to checkout');
    }
  };

  const handleWishlistToggle = async () => {
    const result = await toggleWishlist(product);
    if (result.message) {
      setToast(result.message);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] hover:-translate-y-[5px] transition-all duration-300 p-4 flex flex-col justify-between w-full h-full max-w-sm mx-auto border border-gray-100">
      {!product.inStock && (
        <span className="absolute left-3 top-3 z-20 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white">
          Out of Stock
        </span>
      )}

      <button
        type="button"
        onClick={handleWishlistToggle}
        className="absolute right-3 top-3 z-20 rounded-full bg-white/95 p-2 shadow-sm hover:shadow transition"
        aria-label="Toggle wishlist"
      >
        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
      </button>

      <div>
        <Link href={`/products/${productId}`}>
          <div className="relative h-56 w-full bg-white rounded-xl p-3 flex items-center justify-center overflow-hidden shadow-sm">
            {product.image && !imageError ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                unoptimized
                onError={() => setImageError(true)}
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
            )}
          </div>
        </Link>

        <Link href={`/products/${productId}`}>
          <h3 className="mt-4 text-base font-bold tracking-tight text-gray-900 line-clamp-2 hover:text-blue-700 transition-colors min-h-[2.75rem]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <p className="text-blue-700 text-xl font-bold tracking-tight">{formatPrice(product.price)}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || cartPending}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
            alreadyInCart
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white'
          } transition-all duration-300 ease-in-out hover:scale-105 ${
            isCartBtnAnimating ? 'animate-[pulse_0.35s_ease-in-out_1]' : ''
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-flex w-4 h-4 items-center justify-center overflow-hidden">
              <ShoppingCart
                className={`absolute w-4 h-4 transition-all duration-300 ease-in-out ${
                  alreadyInCart ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
                }`}
              />
              <Check
                className={`absolute w-4 h-4 transition-all duration-300 ease-in-out ${
                  alreadyInCart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              />
            </span>

            <span className="relative inline-flex h-5 items-center overflow-hidden">
              <span
                className={`transition-all duration-300 ease-in-out ${
                  alreadyInCart ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
                }`}
              >
                {cartPending ? 'Please wait...' : 'Add to Cart'}
              </span>
              <span
                className={`absolute left-0 transition-all duration-300 ease-in-out ${
                  alreadyInCart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {cartPending ? 'Please wait...' : '✓ Added'}
              </span>
            </span>
          </span>
        </button>

        <button
          onClick={handleBuyNow}
          disabled={!product.inStock}
          className="flex-1 bg-blue-900 text-white hover:bg-blue-800 active:scale-[0.99] py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Buy Now
        </button>
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
