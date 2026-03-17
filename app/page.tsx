'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryCard } from '@/components/category-card';
import { ServiceCard } from '@/components/service-card';
import { Category, Service } from '@/lib/types';
import {
  ArrowRight,
  ShieldCheck,
  Camera,
  Eye,
  Smartphone,
  Wrench,
  Truck,
  Headphones,
  BadgeCheck,
} from 'lucide-react';

const trustFeatures = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over 500' },
  { icon: ShieldCheck, title: 'Warranty', desc: '2 Year guarantee' },
  { icon: Headphones, title: '24/7 Support', desc: 'Expert assistance' },
  { icon: BadgeCheck, title: 'Genuine Products', desc: '100% authentic' },
];

const categories: Category[] = [
  { id: '1', name: 'Dome Cameras', icon: '🔵', image: '/images/dome-cameras.jpg' },
  { id: '2', name: 'Bullet Cameras', icon: '🎯', image: '/images/bullet-cameras.jpg' },
  { id: '3', name: 'PTZ Cameras', icon: '🔄', image: '/images/ptz-cameras.jpg' },
  { id: '4', name: 'WiFi Cameras', icon: '📶', image: '/images/wifi-cameras.jpg' },
  { id: '5', name: '4G Cameras', icon: '📡', image: '/images/4g-cameras.jpg' },
  { id: '6', name: 'Solar Cameras', icon: '☀️', image: '/images/solar-cameras.jpg' },
];

const securityFeatures = [
  { icon: Camera, title: 'HD Surveillance', desc: 'Crystal-clear 4K video recording with wide-angle coverage for every corner.' },
  { icon: Eye, title: 'Night Vision Cameras', desc: 'Infrared technology for clear footage even in complete darkness up to 30m.' },
  { icon: Smartphone, title: 'Remote Mobile Monitoring', desc: 'Monitor your property in real-time from anywhere using your smartphone.' },
  { icon: Wrench, title: 'Professional Installation', desc: 'Expert setup by certified technicians with lifetime configuration support.' },
];

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch('/api/services', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
  }, []);

  return (
    <div className="bg-[#f8fafc]">

      {/* ───────── HERO ───────── */}
      <section
        className="relative w-full min-h-[60vh] md:min-h-[85vh] overflow-hidden flex items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/cctv-hero.png.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/35"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 text-left text-white">
          <div className="max-w-lg sm:max-w-xl lg:max-w-2xl text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Advanced Surveillance
              <br className="hidden sm:block" />
              Technology
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-200">
              Experience crystal-clear 4K recording with night vision, AI detection, and remote monitoring.
            </p>
            <div className="mt-6 flex gap-4">
              <Link
                href="/products"
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white text-base transition"
              >
                Shop Cameras
              </Link>
              <Link
                href="/services"
                className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-black font-semibold text-base transition"
              >
                View Services
              </Link>
            </div>
            <div className="mt-10 flex gap-16">
              <div>
                <h3 className="text-3xl font-bold">100+</h3>
                <p className="text-sm text-gray-300">INSTALLATIONS</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold">20+</h3>
                <p className="text-sm text-gray-300">YEARS EXP.</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold">100+</h3>
                <p className="text-sm text-gray-300">HAPPY CLIENTS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FEATURE BAR ───────── */}
      <section className="py-8 md:py-10 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustFeatures.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition min-h-[132px] flex flex-col items-center justify-center"
              >
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-2">
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900">{f.title}</p>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── SECURITY FEATURES ───────── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Why Choose Our Security Systems</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">Advanced technology trusted by hundreds of homes and businesses across the region</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {securityFeatures.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg p-6 text-center transition-all duration-200 group"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CATEGORIES ───────── */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">Shop by Category</h2>
              <p className="text-sm text-slate-500 mt-1">Browse our wide range of surveillance equipment</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── SERVICES ───────── */}
      {services.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Our Services</h2>
                <p className="text-sm text-slate-500 mt-1">Professional installation, maintenance &amp; support</p>
              </div>
              <Link href="/services" className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.slice(0, 3).map((service) => (
                <ServiceCard key={service._id || service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── CTA ───────── */}
      <section className="py-16 md:py-20 bg-blue-50 border-t border-b border-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheck className="w-10 h-10 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
            Ready to Secure Your Property?
          </h2>
          <p className="text-gray-600 text-sm md:text-base mb-8 max-w-xl mx-auto">
            Contact our team today for a free security consultation and custom quote tailored to your needs.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/services" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors shadow-md shadow-blue-600/20">
              Get Free Consultation <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/#contact" className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#1e3a8a] font-medium px-6 py-3 rounded-lg text-sm border border-gray-200 transition-colors shadow-sm">
              Call Us Today
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
