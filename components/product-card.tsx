'use client';

import { Product } from '@/lib/types';
import Link from 'next/link';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '@/lib/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const productId = product._id || product.id;

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-200">
      {/* Image */}
      <Link href={`/products/${productId}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
              <span className="text-5xl">📷</span>
            </div>
          )}

          {/* Stock badge — top right */}
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                product.inStock
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Category badge — bottom left */}
          {product.category && (
            <div className="absolute bottom-2 left-2">
              <span className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-white">
                {product.category}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={`/products/${productId}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {typeof product.rating === 'number' && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            {product.reviews > 0 && (
              <span className="text-xs text-gray-400">({product.reviews})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-2 mb-3">
          <span className="text-lg font-bold text-blue-600">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Link href={`/products/${productId}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" />
              Details
            </Button>
          </Link>
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isAdding ? 'Added!' : 'Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
