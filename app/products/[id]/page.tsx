'use client';

import { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/contexts/cart-context';
import { ShoppingCart, Truck, Shield, RotateCcw, CheckCircle2, Check } from 'lucide-react';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/currency';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isCartBtnAnimating, setIsCartBtnAnimating] = useState(false);
  const { toggleCartItem, isInCart, isCartActionPending } = useCart();
  const router = useRouter();

  // Fetch product from MongoDB API
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setProduct(data);
        setCurrentImage(0);

        // Fetch related products from API
        const allRes = await fetch('/api/products', { cache: 'no-store' });
        if (allRes.ok) {
          const allProducts: Product[] = await allRes.json();
          const pid = data._id || data.id;
          const related = allProducts
            .filter(
              (p) =>
                p.category === data.category &&
                (p._id || p.id) !== pid
            )
            .slice(0, 3);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (cartPending) return;
    setIsCartBtnAnimating(true);
    setTimeout(() => setIsCartBtnAnimating(false), 350);
    await toggleCartItem(product, quantity);
  };

  const handleBuyNow = async () => {
    try {
      setIsBuyingNow(true);
      const productId = product._id || product.id;

      const res = await fetch('/api/orders/buy-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/login?redirect=/checkout');
          return;
        }
        alert(data?.message || 'Failed to proceed');
        return;
      }

      if (data?.orderId) {
        router.push(`/checkout?orderId=${data.orderId}`);
      } else {
        alert('Failed to proceed');
      }
    } catch (error) {
      console.error('Buy now failed:', error);
    } finally {
      setIsBuyingNow(false);
    }
  };

  const hasSpecs = product.specs && Object.keys(product.specs).length > 0;
  const highlights = Array.isArray(product.features)
    ? product.features.filter((item) => Boolean(item && item.trim()))
    : [];
  const alreadyInCart = isInCart(product._id || product.id);
  const cartPending = isCartActionPending(product._id || product.id);
  const productImages = (Array.isArray(product.images) ? product.images : [])
    .filter((img) => typeof img === 'string' && img.trim().length > 0);
  if (productImages.length === 0 && product.image) {
    productImages.push(product.image);
  }

  return (
    <div className="bg-gray-50">
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
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16 items-start">
          {/* Product Image */}
          <div className="md:sticky md:top-24">
            <div className="group w-full h-96 lg:h-[28rem] bg-white rounded-xl p-6 flex items-center justify-center overflow-hidden shadow-md border border-border">
              {productImages[currentImage] ? (
                <img
                  src={productImages[currentImage]}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center text-6xl">
                  📷
                </div>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {productImages.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setCurrentImage(i)}
                    className={`rounded-lg border overflow-hidden transition ${
                      i === currentImage
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 bg-white rounded-xl shadow-md border border-border p-6 lg:p-8">
            {/* Title and Price */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>

              {highlights.length > 0 ? (
                <ul className="space-y-2">
                  {highlights.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Limited Offer
                </span>
                {product.inStock ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    Out of Stock
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="text-4xl md:text-5xl font-extrabold text-blue-700 tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {!product.inStock && (
                  <span className="bg-destructive text-destructive-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Out of Stock
                  </span>
                )}
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Best Price
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Quantity
                </label>
                <div className="inline-flex items-center border border-border rounded-xl overflow-hidden bg-gray-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 text-lg hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <div className="w-12 h-11 border-l border-r border-border flex items-center justify-center text-base font-semibold">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 text-lg hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  disabled={!product.inStock || cartPending}
                  className={`w-full h-12 rounded-xl gap-2 transition-colors ${
                    alreadyInCart
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } transition-all duration-300 ease-in-out hover:scale-105 ${
                    isCartBtnAnimating ? 'animate-[pulse_0.35s_ease-in-out_1]' : ''
                  }`}
                >
                  <span className="relative inline-flex w-5 h-5 items-center justify-center overflow-hidden">
                    <ShoppingCart
                      className={`absolute w-5 h-5 transition-all duration-300 ease-in-out ${
                        alreadyInCart ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
                      }`}
                    />
                    <Check
                      className={`absolute w-5 h-5 transition-all duration-300 ease-in-out ${
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
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-xl bg-blue-900 hover:bg-blue-800 text-white border-blue-900 transition-colors"
                  onClick={handleBuyNow}
                  disabled={!product.inStock || isBuyingNow}
                >
                  {isBuyingNow ? 'Please wait...' : 'Buy Now'}
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 rounded-lg p-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Free Shipping
                  </p>
                  <p className="text-xs text-muted-foreground">Across India</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 rounded-lg p-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Warranty</p>
                  <p className="text-xs text-muted-foreground">1-year protection</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 rounded-lg p-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    Returns
                  </p>
                  <p className="text-xs text-muted-foreground">10-day policy</p>
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
                <ProductCard key={relatedProduct._id || relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
