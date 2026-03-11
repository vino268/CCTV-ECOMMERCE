'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { CategoryCard } from '@/components/category-card';
import { Product, Category } from '@/lib/types';
import { ArrowRight, Shield, Clock, Award, Zap, Camera, CheckCircle } from 'lucide-react';

const categories: Category[] = [
  { id: '1', name: 'Dome Cameras', icon: '📷', image: '/images/dome-cameras.jpg' },
  { id: '2', name: 'Bullet Cameras', icon: '🔫', image: '/images/bullet-cameras.jpg' },
  { id: '3', name: 'PTZ Cameras', icon: '🎯', image: '/images/ptz-cameras.jpg' },
  { id: '4', name: 'Thermal Cameras', icon: '🌡️', image: '/images/thermal-cameras.jpg' },
  { id: '5', name: 'Recorders & Storage', icon: '💾', image: '/images/recorders.jpg' },
  { id: '6', name: 'Accessories', icon: '🔧', image: '/images/accessories.jpg' },
];

const whyChooseUs = [
  { title: '20+ Years Experience', description: 'Over two decades of industry expertise in CCTV and security systems.' },
  { title: 'Expert Technical Support', description: 'Dedicated support team available 24/7 to assist you.' },
  { title: 'Premium Quality Products', description: 'Only the highest-grade CCTV equipment from trusted brands.' },
  { title: 'Competitive Pricing', description: 'Best value for money with flexible financing options.' },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error fetching products:', err));
  }, []);

  const featuredProducts = products.slice(0, 6);

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 py-24 md:py-36 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-4">
                  <Shield className="w-3.5 h-3.5" />
                  Trusted Security Partner
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Professional CCTV &{' '}
                  <span className="text-blue-400">Security</span> Solutions
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                className="text-lg text-blue-100/80 max-w-lg leading-relaxed"
              >
                Protect your home and business with advanced surveillance systems. 20+ years of expertise, trusted by thousands.
              </motion.p>

              <motion.ul
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
                className="space-y-2"
              >
                {['HD & 4K cameras', 'Professional installation', '24/7 technical support'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-blue-200">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
                className="flex gap-4 flex-wrap"
              >
                <Link href="/products">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-400 text-white gap-2 shadow-lg shadow-blue-500/30">
                    Shop Cameras <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                    View Services
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right Content — Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="hidden md:flex items-center justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="relative w-full max-w-md aspect-square bg-gradient-to-br from-blue-800/60 to-blue-600/30 rounded-3xl border border-blue-400/20 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-blue-900/40"
              >
                {/* Orbit rings */}
                <div className="absolute inset-6 rounded-full border border-blue-400/10" />
                <div className="absolute inset-12 rounded-full border border-blue-400/10" />
                {/* Icon */}
                <Camera className="w-28 h-28 text-blue-300/80" strokeWidth={0.8} />
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white text-xs font-medium"
                >
                  4K Ultra HD
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute bottom-8 left-8 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl px-3 py-2 text-green-300 text-xs font-medium"
                >
                  ● Live Monitoring
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose TN Automation?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by thousands of businesses and homeowners for reliable security solutions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {whyChooseUs.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 w-10 h-10 rounded-lg flex items-center justify-center">
                  {index === 0 && <Award className="w-5 h-5 text-blue-600" />}
                  {index === 1 && <Clock className="w-5 h-5 text-blue-600" />}
                  {index === 2 && <Shield className="w-5 h-5 text-blue-600" />}
                  {index === 3 && <Zap className="w-5 h-5 text-blue-600" />}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Check out our best-selling security cameras and equipment
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Browse by Category
            </h2>
            <p className="text-muted-foreground">
              Find exactly what you need from our wide range of surveillance equipment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Secure Your Property?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Contact our team today for a free security consultation and custom quote for your needs.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Free Consultation <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
              Call Us Today
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
