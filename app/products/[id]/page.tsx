'use client';

import { products } from '@/lib/data';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/contexts/cart-context';
import { Star, ShoppingCart, Truck, Shield, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  // Load admin products from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_products');
    if (stored) {
      setAdminProducts(JSON.parse(stored));
    }
    setMounted(true);
  }, []);

  const allProducts = [...products, ...adminProducts];
  const product = allProducts.find((p) => p.id === params.id);

  // Before localStorage has loaded, show a loading state for non-static products
  if (!product && !mounted) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const hasSpecs = product.specs && Object.keys(product.specs).length > 0;

  return (
    <div className="bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 text-sm">
          <Link href="/" className="text-primary hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="text-primary hover:underline">
            Products
          </Link>
          <span>/</span>
          <span className="text-muted-foreground">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <div>
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center text-6xl border border-border">
                📷
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {!product.inStock && (
                  <span className="bg-destructive text-destructive-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Out of Stock
                  </span>
                )}
                {product.inStock && (
                  <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-sm font-semibold">
                    In Stock
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground">{product.description}</p>

            {/* Quantity and Add to Cart */}
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Quantity
                </label>
                <div className="flex border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center py-2 border-l border-r border-border focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <Button
                onClick={handleAddToCart}
                size="lg"
                disabled={!product.inStock}
                className="gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {isAdded ? 'Added to Cart!' : 'Add to Cart'}
              </Button>
            </div>

            {/* Buy Now Button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              disabled={!product.inStock}
              onClick={() => {
                addToCart(product, quantity);
                const user = localStorage.getItem('user');
                if (user) {
                  router.push('/checkout');
                } else {
                  localStorage.setItem('redirectAfterLogin', '/checkout');
                  router.push('/account');
                }
              }}
            >
              Buy Now
            </Button>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Free Shipping
                  </p>
                  <p className="text-xs text-muted-foreground">On orders over $100</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Warranty</p>
                  <p className="text-xs text-muted-foreground">1-year protection</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Returns
                  </p>
                  <p className="text-xs text-muted-foreground">30-day guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {hasSpecs && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Specifications
            </h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {Object.entries(product.specs).map(([key, value], index) => (
                <div
                  key={key}
                  className={`flex ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                >
                  <div className="w-1/3 px-6 py-4 font-semibold text-foreground bg-muted/50">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <div className="w-2/3 px-6 py-4 text-muted-foreground">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Related Products
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
