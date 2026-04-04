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
import { getSafeImageSrc } from '@/lib/product-image';

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
  const productImage = getSafeImageSrc(product.image, '/products/default.jpg');
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
    if (authLoading) return;
    if (!isAuthenticated) {
      setToast('Please login first');
      router.push('/login?redirect=/products');
      return;
    }
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/orders/buy-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        setToast('Session expired, please login again');
        router.push('/login?redirect=/checkout');
        return;
      }

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
    <div className="group relative mx-auto flex h-full w-full flex-col justify-between rounded-xl border border-gray-100 bg-white p-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.1)] md:p-4">
      {!product.inStock && (
        <span className="absolute left-3 top-3 z-20 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white">
          Out of Stock
        </span>
      )}

      <button
        type="button"
        onClick={handleWishlistToggle}
        className="absolute right-2.5 top-2.5 z-20 rounded-full bg-white/95 p-2 shadow-sm transition hover:shadow"
        aria-label="Toggle wishlist"
      >
        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
      </button>

      <div>
        <Link href={`/products/${productId}`}>
          <div className="relative flex h-52 w-full items-center justify-center overflow-hidden rounded-lg bg-white p-2.5 shadow-sm">
            {productImage && !imageError ? (
              <Image
                src={productImage}
                alt={product.name}
                fill
                unoptimized
                onError={() => setImageError(true)}
                className="object-contain p-2.5 transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
            )}
          </div>
        </Link>

        <Link href={`/products/${productId}`}>
          <h3 className="mt-3 min-h-[2.5rem] line-clamp-2 text-[15px] font-semibold tracking-tight text-gray-900 transition-colors hover:text-blue-700 md:text-base">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2.5 flex items-center gap-2">
          <p className="text-lg font-bold tracking-tight text-blue-700 md:text-xl">{formatPrice(product.price)}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || cartPending}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
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
          className="flex-1 rounded-lg bg-blue-900 py-2 text-sm font-medium text-white transition hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
