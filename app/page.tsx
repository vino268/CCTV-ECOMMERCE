'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { CategoryCard } from '@/components/category-card';
import { Product, Category } from '@/lib/types';
import { ArrowRight, Shield, Clock, Award, Zap } from 'lucide-react';

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
      <section className="relative bg-gradient-to-br from-secondary via-secondary/95 to-primary/80 text-secondary-foreground py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,var(--primary)_0%,transparent_50%)] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Professional CCTV & Security Solutions
              </h1>
              <p className="text-lg text-secondary-foreground/80 max-w-lg">
                Protect what matters most with TN Automation's advanced security camera systems and professional installation services.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="text-black border-white bg-white hover:bg-white/90">
                    View Services
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl shadow-black/20">
                <img
                  src="/images/imagehome.png"
                  alt="Professional CCTV & Security Systems"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose TN Automation?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by thousands of businesses and homeowners for reliable security solutions
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {whyChooseUs.map((feature, index) => (
              <div key={index} className="bg-card border border-border/60 rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                <div className="mb-4">
                  {index === 0 && <Award className="w-8 h-8 text-primary" />}
                  {index === 1 && <Clock className="w-8 h-8 text-primary" />}
                  {index === 2 && <Shield className="w-8 h-8 text-primary" />}
                  {index === 3 && <Zap className="w-8 h-8 text-primary" />}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
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
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/20 to-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Browse by Category
            </h2>
            <p className="text-muted-foreground">
              Find exactly what you need from our wide range of surveillance equipment
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground">
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
