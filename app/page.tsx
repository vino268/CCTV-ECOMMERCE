'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/contexts/cart-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { formatPrice } from '@/lib/currency';
import { getSafeImageSrc } from '@/lib/product-image';
import {
  ArrowRight,
  Wrench,
  ShieldCheck,
  Headphones,
  Star,
  ShoppingCart,
  Check,
  Camera,
  CheckCircle2,
  Wallet,
  CircleHelp,
  Shield,
  IndianRupee,
  LifeBuoy,
  HardDrive,
  Cable,
  Network,
  Tag,
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type HomeProductCardProps = {
  product: Product & { isInCart: boolean };
  isPending: boolean;
  onAddToCart: (product: Product) => Promise<void>;
  onBuyNow: (product: Product) => Promise<void>;
};

type HomeCategory = {
  _id: string;
  name: string;
  productCount: number;
};

function HomeProductCard({ product, isPending, onAddToCart, onBuyNow }: HomeProductCardProps) {
  const productId = product._id ?? '';
  const primaryImage = getSafeImageSrc(product.images?.[0] || product.image, '/products/default.jpg');

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-4 flex flex-col h-full">
      <div>
        <Link href={`/products/${productId}`}>
          <div className="bg-gray-100 rounded-xl overflow-hidden h-[200px] flex items-center justify-center">
            <Image
              src={primaryImage}
              alt={product.name}
              width={400}
              height={180}
              unoptimized
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        <Link href={`/products/${productId}`}>
          <h3 className="mt-4 font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        <p className="text-blue-600 font-bold text-lg mt-2">{formatPrice(product.price)}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={isPending || !product.inStock}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Please wait...' : product.isInCart ? '✓ Added' : 'Add to Cart'}
        </button>
        <button
          type="button"
          onClick={() => onBuyNow(product)}
          disabled={!product.inStock}
          className="flex-1 bg-blue-900 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { toggleCartItem, isInCart, isCartActionPending } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [topCategories, setTopCategories] = useState<HomeCategory[]>([]);

  const featureStrip = [
    {
      icon: CheckCircle2,
      title: 'Free Installation',
      desc: 'Available on selected plans',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      desc: 'Always-on customer assistance',
    },
    {
      icon: Shield,
      title: '1 Year Warranty',
      desc: 'Peace of mind on every purchase',
    },
    {
      icon: Wallet,
      title: 'Secure Payments',
      desc: 'Safe and trusted checkout process',
    },
  ];

  const whyChooseUs = [
    {
      icon: Wrench,
      title: 'Professional Installation',
      desc: 'Certified technicians for accurate setup and cable management.',
    },
    {
      icon: Camera,
      title: 'High Quality Cameras',
      desc: 'Reliable surveillance hardware from trusted industry brands.',
    },
    {
      icon: IndianRupee,
      title: 'Affordable Pricing',
      desc: 'Cost-effective packages for homes, shops, and enterprises.',
    },
    {
      icon: LifeBuoy,
      title: 'Expert Support',
      desc: 'Prompt guidance for troubleshooting, upgrades, and maintenance.',
    },
  ];

  const services = [
    {
      icon: Wrench,
      title: 'Installation',
      desc: 'Site survey, camera placement, and complete professional setup.',
      href: '/services',
    },
    {
      title: 'Maintenance',
      desc: 'Preventive checks and fast issue resolution to avoid downtime.',
      icon: ShieldCheck,
      href: '/services',
    },
    {
      title: 'Consultation',
      desc: 'Expert guidance on coverage, camera type, and security planning.',
      icon: CircleHelp,
      href: '/services',
    },
  ];

  const testimonials = [
    {
      name: 'Arun Kumar',
      role: 'Retail Store Owner',
      rating: 5,
      text: 'TN Automation gave us a complete CCTV setup with clean installation and excellent clarity. Highly recommended.',
    },
    {
      name: 'Priya Natarajan',
      role: 'Homeowner',
      rating: 5,
      text: 'The team was professional and patient. The mobile monitoring setup works perfectly even at night.',
    },
    {
      name: 'Suresh Babu',
      role: 'Warehouse Manager',
      rating: 4,
      text: 'Great pricing and fast support. Their consultation helped us cover all blind spots efficiently.',
    },
  ];

  useEffect(() => {
    const loadRecentProducts = () => {
      setProductsLoading(true);
      fetch(`${BASE_URL}/api/products/recent`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch((err) => setProducts([]));
      setTimeout(() => setProductsLoading(false), 250);
    };

    loadRecentProducts();
    const intervalId = setInterval(loadRecentProducts, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadTopCategories = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch(`${BASE_URL}/api/categories`, { cache: 'no-store' }),
          fetch(`${BASE_URL}/api/products`, { cache: 'no-store' }),
        ]);

        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();

        if (!Array.isArray(categoriesData) || !Array.isArray(productsData)) {
          setTopCategories([]);
          return;
        }

        const counts = new Map<string, number>();
        for (const product of productsData) {
          if (typeof product?.category === 'string') {
            const key = product.category.trim().toLowerCase();
            counts.set(key, (counts.get(key) || 0) + 1);
          }
        }

        const normalized = categoriesData
          .map((cat: any) => {
            const name = typeof cat?.name === 'string' ? cat.name.trim() : '';
            return {
              _id: cat?._id || name,
              name,
              productCount: counts.get(name.toLowerCase()) || 0,
            };
          })
          .filter((cat) => cat.name);

        const withProducts = normalized.filter((cat) => cat.productCount > 0);
        const withoutProducts = normalized.filter((cat) => cat.productCount === 0);
        const selected = [...withProducts, ...withoutProducts].slice(0, 6);

        setTopCategories(selected);
      } catch {
        setTopCategories([]);
      }
    };

    loadTopCategories();
  }, []);

  const getCategoryMeta = (name: string) => {
    const key = name.toLowerCase();

    if (key.includes('camera')) {
      return { icon: Camera, description: 'Reliable coverage for indoor and outdoor surveillance.' };
    }
    if (key.includes('dvr') || key.includes('nvr') || key.includes('storage')) {
      return { icon: HardDrive, description: 'Smart recording solutions for secure video backups.' };
    }
    if (key.includes('accessor') || key.includes('cable')) {
      return { icon: Cable, description: 'Essential mounts, cables, and setup components.' };
    }
    if (key.includes('network') || key.includes('router')) {
      return { icon: Network, description: 'Stable networking gear for uninterrupted monitoring.' };
    }

    return { icon: Tag, description: 'Browse high-demand products in this category.' };
  };

  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 8);
  }, [products]);

  const renderStars = (rating: number) => {
    const rounded = Math.max(0, Math.min(5, Math.round(rating)));
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star
        key={idx}
        className={`h-4 w-4 ${idx < rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
      />
    ));
  };

  const handleAddToCart = async (product: Product) => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/products');
      return;
    }
    await toggleCartItem(product, 1);
  };

  const handleBuyNow = async (product: Product) => {
    if (!product.inStock) return;
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    const productId = product._id ?? '';

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/buy-now`, {
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
        router.push('/login?redirect=/checkout');
        return;
      }

      if (res.ok && data?.orderId) {
        router.push(`/checkout?orderId=${data.orderId}`);
      }
    } catch {
      // Keep silent here to avoid interrupting browsing flow.
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-[#f8fafc]">
      <section className="w-full min-h-screen bg-gradient-to-r from-[#1e3a8a] to-[#6d28d9]">
        <div className="grid min-h-screen w-full items-center gap-10 px-6 py-16 md:px-16 lg:grid-cols-2 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 text-center lg:text-left"
          >
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Advanced CCTV Security for Modern Protection
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm text-blue-100/90 lg:mx-0 lg:text-base">
              From HD surveillance cameras to complete installation and support, TN Automation helps you secure every corner with confidence.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/products">
                <Button className="bg-blue-500 text-white hover:bg-blue-600">
                  Shop Cameras
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-indigo-800">
                  Get Free Consultation
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
            transition={{ opacity: { duration: 0.6 }, x: { duration: 0.6 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
            className="relative z-10 flex items-center justify-center"
          >
            <div className="relative w-full max-w-xl overflow-hidden rounded-xl shadow-lg transition duration-300 hover:scale-[1.02]">
              <Image
                src="/images/camera.jpg"
                alt="TN Automation CCTV"
                width={820}
                height={620}
                className="h-auto w-full rounded-xl object-cover"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 md:grid-cols-4 lg:px-8">
          {featureStrip.map((item) => (
            <div
              key={item.title}
              className="min-h-[100px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-xl bg-blue-100 p-3 text-blue-600">
                  <item.icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">{item.title}</p>
                  <p className="text-base text-gray-600">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="category-section">
            <div className="category-header">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Shop by Category</h2>
                <p className="mt-1 text-sm text-gray-600">Choose the right surveillance setup for your space</p>
              </div>
              <Link href="/products" className="category-browse-link">
                Browse All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="category-grid">
              {topCategories.map((category) => {
                const meta = getCategoryMeta(category.name);
                const Icon = meta.icon;

                return (
                  <div
                    className="category-card"
                    key={category._id}
                    onClick={() => router.push(`/products?category=${encodeURIComponent(category.name)}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/products?category=${encodeURIComponent(category.name)}`);
                      }
                    }}
                  >
                    <div className="icon text-blue-600">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3>{category.name}</h3>
                    <p>{meta.description}</p>
                    <span className="category-btn inline-flex items-center gap-1">
                      Explore <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">Recent Products</h2>
              <p className="text-sm text-gray-600">Top picks from our newest and best-selling inventory</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="gap-2 border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white">
                Explore Full Catalog <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="h-44 rounded-lg bg-gray-200" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-2/5 rounded bg-gray-200" />
                  <div className="mt-4 h-9 rounded-lg bg-gray-200" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              No recent products available
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {featuredProducts.slice(0, 6).map((product) => {
                const productId = product._id ?? '';
                const productWithCart = {
                  ...product,
                  isInCart: isInCart(productId),
                };
                const pending = isCartActionPending(productId);

                return (
                  <HomeProductCard
                    key={productId}
                    product={productWithCart}
                    isPending={pending}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Why Choose TN Automation</h2>
            <p className="mt-2 text-sm text-gray-600">Designed for performance, reliability, and long-term support</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Our Services
            </h2>
              <p className="mt-1 text-sm text-gray-600">
                End-to-end support for planning, installation, and maintenance
              </p>
            </div>
            <Link href="/services">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Book Service</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-2 text-blue-700 transition-colors duration-300 group-hover:bg-blue-700 group-hover:text-white">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{service.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                  Book Service <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Customer Testimonials</h2>
            <p className="mt-2 text-sm text-gray-600">What our clients say about our products and service quality</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-1">{renderStars(item.rating)}</div>
                <p className="text-sm leading-relaxed text-gray-600">"{item.text}"</p>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
