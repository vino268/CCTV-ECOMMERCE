'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: '/images/cctv-hero.png.jpg',
    heading: 'Advanced Surveillance\nTechnology',
    description:
      'Experience crystal-clear 4K recording with night vision, AI detection, and remote monitoring.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1920&q=85&auto=format',
    heading: 'Advanced Surveillance\nTechnology',
    description:
      'Experience crystal-clear 4K recording with night vision, AI detection, and remote monitoring.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1920&q=85&auto=format',
    heading: 'Expert Installation\n& Support',
    description:
      'Our certified technicians ensure seamless setup with 24/7 technical support and maintenance.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1920&q=85&auto=format',
    heading: 'Complete Security\nfor Every Need',
    description:
      'From homes to warehouses — dome, bullet, PTZ, WiFi, 4G, and solar-powered cameras available.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1558002038-1055907df827?w=1920&q=85&auto=format',
    heading: 'Smart Monitoring\n24/7 Protection',
    description:
      'Stay connected with real-time alerts, mobile access, and intelligent motion detection around the clock.',
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === current) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 800);
    },
    [current, isTransitioning],
  );

  const next = useCallback(
    () => goTo((current + 1) % slides.length),
    [current, goTo],
  );
  const prev = useCallback(
    () => goTo((current - 1 + slides.length) % slides.length),
    [current, goTo],
  );

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <section className="relative w-full min-h-[600px] h-[100svh] overflow-hidden">
      {/* Background images with Ken Burns effect */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-[800ms] ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            role="img"
            aria-label={slide.heading.replace('\n', ' ')}
            style={{ backgroundImage: `url(${slide.image})` }}
            className={`absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-out ${
              i === current ? 'scale-105' : 'scale-100'
            }`}
          />
        </div>
      ))}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      {/* Bottom vignette for dots readability */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-white">
          {/* Animated badge */}
          <span className="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm text-blue-300 text-xs font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full border border-blue-400/30 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Trusted Security Partner
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] whitespace-pre-line drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {slides[current].heading}
          </h1>

          <p className="mt-5 text-base sm:text-lg md:text-xl text-gray-200/90 max-w-lg leading-relaxed drop-shadow">
            {slides[current].description}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-lg text-sm transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
            >
              Shop Cameras
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-lg text-sm border border-white/20 hover:border-white/40 transition-all"
            >
              View Services
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold tracking-tight">500+</p>
              <p className="text-xs text-gray-400 mt-0.5">Installations</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold tracking-tight">20+</p>
              <p className="text-xs text-gray-400 mt-0.5">Years Exp.</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold tracking-tight">1000+</p>
              <p className="text-xs text-gray-400 mt-0.5">Happy Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/25"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/25"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide indicator dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-9 h-3 bg-blue-500 shadow-lg shadow-blue-500/40'
                : 'w-3 h-3 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-8 right-6 z-20 text-white/50 text-xs font-mono tracking-widest hidden sm:block">
        {String(current + 1).padStart(2, '0')}{' '}
        <span className="text-white/25">/</span>{' '}
        {String(slides.length).padStart(2, '0')}
      </div>
    </section>
  );
}
