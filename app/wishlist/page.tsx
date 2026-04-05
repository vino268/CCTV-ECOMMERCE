'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@/lib/contexts/wishlist-context';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/lib/contexts/auth-context';
import { getSafeImageSrc } from '@/lib/product-image';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { wishlist, loading, toggleWishlist, refreshWishlist } = useWishlist();
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/wishlist');
      return;
    }
    refreshWishlist();
  }, [router, refreshWishlist, authLoading, isAuthenticated]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleRemove = async (product: any) => {
    const result = await toggleWishlist(product);
    if (result.message) {
      setToast(result.message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-1">Saved products synced across your account</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
                <div className="h-44 rounded-xl bg-gray-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
                <div className="mt-5 h-10 rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <Heart className="w-8 h-8 text-rose-400 mx-auto" />
            <h2 className="mt-3 text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
            <p className="mt-1 text-gray-500">Save products to quickly find them later.</p>
            <Link
              href="/products"
              className="inline-flex mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const product = item.productId;
              if (!product) return null;

              const productId = product._id ?? '';
              const productImage = getSafeImageSrc(product.image, '/products/default.jpg');

              return (
                <div
                  key={item._id || productId}
                  className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-4"
                >
                  <button
                    type="button"
                    onClick={() => handleRemove(product)}
                    className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link href={`/products/${productId}`}>
                    <div className="relative h-44 w-full rounded-xl bg-gray-50 overflow-hidden">
                      {productImage ? (
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-contain p-4"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
                      )}
                    </div>
                  </Link>

                  <Link href={`/products/${productId}`}>
                    <h3 className="mt-4 text-base font-semibold text-gray-900 line-clamp-2 hover:text-blue-700 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="mt-2 text-blue-700 text-lg font-bold">{formatPrice(Number(product.price || 0))}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
