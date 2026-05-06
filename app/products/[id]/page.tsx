'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/contexts/cart-context';
import { ShoppingCart, Truck, Shield, RotateCcw, CheckCircle2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { formatPrice } from '@/lib/currency';
import { getSafeImageSrc } from '@/lib/product-image';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [brokenImageIndexes, setBrokenImageIndexes] = useState<number[]>([]);
  const [isModalImageBroken, setIsModalImageBroken] = useState(false);
  const [isCartBtnAnimating, setIsCartBtnAnimating] = useState(false);
  const { toggleCartItem, isInCart, isCartActionPending } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Fetch product from MongoDB API
  useEffect(() => {
    async function fetchProduct() {
      try {
        setError(false);
        const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Product not found');
        }

        const data = await res.json().catch(() => ({}));
        const productData: Product | null = (data?.product || null) as Product | null;

        if (!productData) {
          throw new Error('Product not found');
        }

        setProduct(productData);
        setCurrentImage(0);
        setCurrentModalIndex(0);
        setBrokenImageIndexes([]);
        setIsModalImageBroken(false);

        // Try to get related products from API response
        let related = Array.isArray(data?.relatedProducts) ? data.relatedProducts : [];

        // If no related products from API, fetch all products and filter by category
        if (related.length === 0 && productData.category) {
          try {
            const allRes = await fetch('/api/products', { cache: 'no-store' });
            if (allRes.ok) {
              const allData = await allRes.json().catch(() => ({}));
              const allProducts = Array.isArray(allData?.products) ? allData.products : [];
              
              // Filter by category and exclude current product
              const categoryData = productData.category as any;
              const categoryId = typeof categoryData === 'object' 
                ? categoryData._id || categoryData.id 
                : categoryData;
              
              related = allProducts
                .filter((item: any) => {
                  const itemCategoryData = item.category as any;
                  const itemCategoryId = typeof itemCategoryData === 'object' 
                    ? itemCategoryData._id || itemCategoryData.id 
                    : itemCategoryData;
                  return itemCategoryId === categoryId && item._id?.toString() !== productData._id?.toString();
                })
                .slice(0, 4);
            }
          } catch (err) {
            console.error('Error fetching all products for filtering:', err);
          }
        }

        setRelatedProducts(related);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(true);
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!showImageModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowImageModal(false);
        return;
      }

      if (event.key === 'ArrowRight') {
        setCurrentModalIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
        return;
      }

      if (event.key === 'ArrowLeft') {
        setCurrentModalIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [showImageModal]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Button onClick={() => router.push('/products')}>Browse Products</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (cartPending) return;
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/products');
      return;
    }
    setIsCartBtnAnimating(true);
    setTimeout(() => setIsCartBtnAnimating(false), 350);
    await toggleCartItem(product, quantity);
  };

  const handleBuyNow = () => {
    const productId: string = product._id ?? '';
    if (!productId) return;

    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/checkout?productId=${productId}`);
      return;
    }

    router.push(`/checkout?productId=${productId}`);
  };

  const hasSpecs = product.specs && Object.keys(product.specs).length > 0;
  const highlights = Array.isArray(product.features)
    ? product.features.filter((item) => Boolean(item && item.trim()))
    : [];
  const productId: string = product._id ?? '';
  const alreadyInCart = isInCart(productId);
  const cartPending = isCartActionPending(productId);
  const productImages = (Array.isArray(product.images) ? product.images : [])
    .map((img) => getSafeImageSrc(img, ''))
    .filter(Boolean);
  const mainImage = getSafeImageSrc(product.image, '');
  if (productImages.length === 0 && mainImage) {
    productImages.push(mainImage);
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
            <div className="group relative w-full h-96 lg:h-[28rem] bg-white rounded-xl p-6 flex items-center justify-center overflow-hidden shadow-md border border-border">
              {productImages[currentImage] ? (
                <Image
                  src={brokenImageIndexes.includes(currentImage) ? '/placeholder.jpg' : productImages[currentImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                  className="cursor-zoom-in rounded-lg object-contain p-6 transition-transform duration-500 group-hover:scale-110"
                  onError={() => {
                    setBrokenImageIndexes((prev) => (prev.includes(currentImage) ? prev : [...prev, currentImage]));
                  }}
                  onClick={() => {
                    setCurrentModalIndex(currentImage);
                    setIsModalImageBroken(false);
                    setShowImageModal(true);
                  }}
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
                    <Image
                      src={brokenImageIndexes.includes(i) ? '/placeholder.jpg' : img}
                      alt={`Thumbnail ${i + 1}`}
                      width={240}
                      height={128}
                      unoptimized
                      className="w-full h-16 object-cover"
                      onError={() => {
                        setBrokenImageIndexes((prev) => (prev.includes(i) ? prev : [...prev, i]));
                      }}
                    />
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
                <div className="flex flex-col gap-2">
                  <span className="text-4xl md:text-5xl font-extrabold text-blue-700 tracking-tight">
                    {formatPrice(product.price * quantity)}
                  </span>
                  <p className="text-sm text-gray-500">
                    {formatPrice(product.price)} × {quantity}
                  </p>
                </div>
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
            <p className="mt-3 text-base md:text-lg text-muted-foreground leading-7 break-words whitespace-normal">
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
                  disabled={!product.inStock}
                >
                  Buy Now
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
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts
                .filter((item: any) => item._id && product._id && item._id.toString() !== product._id.toString())
                .map((item: any) => (
                  <Link
                    key={item._id}
                    href={`/products/${item._id}`}
                    className="border rounded-2xl p-4 hover:shadow-lg transition"
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-white">
                      <Image
                        src={getSafeImageSrc(item.image, '/placeholder.jpg')}
                        alt={item.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <h3 className="font-semibold mt-4 line-clamp-2">
                      {item.name}
                    </h3>

                    <p className="text-blue-600 font-bold text-lg mt-2">
                      {formatPrice(item.price)}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>

      {showImageModal && productImages[currentModalIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setShowImageModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >
          <div
            className="relative flex h-full w-full flex-col md:flex-row"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute left-0 top-0 z-20 flex w-full items-center justify-between border-b border-white/20 bg-black/40 px-4 py-3 backdrop-blur-sm">
              <span className="text-sm font-semibold text-white">Product Images</span>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="rounded-md p-1 text-white transition hover:bg-white/10"
                aria-label="Close image preview"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative mt-14 flex flex-1 items-center justify-center p-4 md:p-8">
              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentModalIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                  className="absolute left-3 z-10 rounded-full bg-white/80 p-2 text-gray-900 shadow-md transition-all duration-300 hover:bg-white md:left-6 md:p-3"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              )}

              <Image
                src={isModalImageBroken ? '/placeholder.jpg' : productImages[currentModalIndex]}
                alt={`${product.name} preview`}
                fill
                sizes="100vw"
                unoptimized
                className="max-h-[85vh] max-w-[90%] rounded-lg object-contain transition-all duration-300"
                onError={() => {
                  setIsModalImageBroken(true);
                  setBrokenImageIndexes((prev) => (prev.includes(currentModalIndex) ? prev : [...prev, currentModalIndex]));
                }}
              />

              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentModalIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 z-10 rounded-full bg-white/80 p-2 text-gray-900 shadow-md transition-all duration-300 hover:bg-white md:right-6 md:p-3"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              )}
            </div>

            <div className="w-full border-t border-gray-200 bg-white p-3 md:w-28 md:border-l md:border-t-0 md:p-3">
              <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-y-auto md:overflow-x-hidden">
                {productImages.map((img, index) => {
                  const active = currentModalIndex === index;
                  return (
                    <button
                      key={`${img}-modal-${index}`}
                      type="button"
                      onClick={() => {
                        setCurrentModalIndex(index);
                        setIsModalImageBroken(false);
                      }}
                      className={`overflow-hidden rounded-md border transition ${
                        active
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                        <Image
                          src={brokenImageIndexes.includes(index) ? '/placeholder.jpg' : img}
                          alt={`Preview ${index + 1}`}
                          width={160}
                          height={128}
                          unoptimized
                          className="h-16 w-20 object-cover md:h-16 md:w-full"
                          onError={() => {
                            setBrokenImageIndexes((prev) => (prev.includes(index) ? prev : [...prev, index]));
                          }}
                        />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
