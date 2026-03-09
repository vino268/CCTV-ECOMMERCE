'use client';

import { Product } from '@/lib/types';
import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
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
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <div className="group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300">
      {/* Image Container */}
      <Link href={`/products/${productId}`}>
        <div className="relative w-full aspect-square bg-muted overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>
          )}
        </div>
      </Link>

      {/* Badge */}
      {!product.inStock && (
        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-semibold">
          Out of Stock
        </div>
      )}

      {product.inStock && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
          In Stock
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${productId}`}>
          <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(product.rating)
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {product.reviews} reviews
          </span>
        </div>

        {/* Price */}
        <div className="mt-3">
          <p className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </p>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="w-full mt-3 gap-2"
          variant={product.inStock ? 'default' : 'outline'}
          size="sm"
        >
          <ShoppingCart className="w-4 h-4" />
          {isAdding ? 'Added!' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}
