'use client';

import { Product } from '@/lib/types';
import Link from 'next/link';
import { Check, ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '@/lib/contexts/cart-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatINRCurrency } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, cart, removeFromCart } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const productId = product._id || product.id;
  const formattedPrice = formatINRCurrency(product.price);

  useEffect(() => {
    setAdded(cart.some((item) => item.productId === productId));
  }, [cart, productId]);

  const handleCartToggle = () => {
    if (!product.inStock) {
      return;
    }

    if (added) {
      removeFromCart(productId);
      setAdded(false);
      return;
    }

    addToCart(product, 1);
    setAdded(true);
  };

  const handleBuyNow = () => {
    const checkoutPath = `/checkout?productId=${encodeURIComponent(productId)}`;

    const user = localStorage.getItem('user');
    if (user) {
      router.push(checkoutPath);
      return;
    }

    localStorage.setItem('redirectAfterLogin', checkoutPath);
    router.push('/account');
  };

  return (
    <div className="group w-full overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/products/${productId}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 transition duration-300 group-hover:scale-105">
              <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <Link href={`/products/${productId}`}>
          <h3 className="min-h-[3rem] text-base font-semibold leading-snug text-slate-900 transition-colors hover:text-blue-600 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-2xl font-bold text-slate-900">
          {formattedPrice}
        </p>

        <div className="mt-3 overflow-hidden rounded-lg">
          <div className="flex w-full divide-x divide-blue-300">
            <button
              onClick={handleCartToggle}
              disabled={!product.inStock}
              className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium text-white transition-all duration-200 ${
                added
                  ? 'bg-green-600'
                  : product.inStock
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'cursor-not-allowed bg-slate-300 text-slate-100'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium text-white transition ${
                product.inStock
                  ? 'bg-blue-700 hover:bg-blue-800'
                  : 'cursor-not-allowed bg-slate-300 text-slate-100'
              }`}
            >
              <Zap className="h-4 w-4" />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
