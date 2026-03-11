'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/lib/contexts/cart-context';
import {
  ShoppingCart, Menu, X, Search, ChevronDown,
  Camera, Crosshair, Radio, Thermometer, HardDrive, Wrench,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { AccountMenu } from '@/components/account-menu';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';

const MEGA_CATEGORIES = [
  { label: 'Dome Cameras', icon: Camera, href: '/products?category=Dome+Camera', desc: 'Indoor & outdoor dome' },
  { label: 'Bullet Cameras', icon: Crosshair, href: '/products?category=Bullet+Camera', desc: 'Long-range surveillance' },
  { label: 'PTZ Cameras', icon: Radio, href: '/products?category=PTZ+Camera', desc: 'Pan-tilt-zoom control' },
  { label: 'Thermal Cameras', icon: Thermometer, href: '/products?category=Thermal+Camera', desc: 'Heat-signature detection' },
  { label: 'Recorders & NVR', icon: HardDrive, href: '/products?category=Recorder', desc: 'Storage & NVR systems' },
  { label: 'Accessories', icon: Wrench, href: '/products?category=Accessory', desc: 'Cables, mounts & more' },
];

export function Navbar() {
  const { getCartCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaOpen, setMegaOpen] = useState(false);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartCount = getCartCount();

  const openMega = () => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 120);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/#about', label: 'About' },
    { href: '/#contact', label: 'Contact' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchQuery('');
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-xl text-blue-600 dark:text-blue-400">
            TN Automation
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/' ? 'text-blue-600 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Home
            </Link>

            {/* Products mega menu trigger */}
            <div
              className="relative"
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
            >
              <button
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/products')
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Products <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`} />
              </button>

              {megaOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[540px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-5 z-50"
                  onMouseEnter={openMega}
                  onMouseLeave={closeMega}
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Browse Categories
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {MEGA_CATEGORIES.map(({ label, icon: Icon, href, desc }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setMegaOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 group transition-colors"
                      >
                        <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2 flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-none mb-0.5">
                            {label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <Link
                      href="/products"
                      onClick={() => setMegaOpen(false)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View all products →
                    </Link>
                    <span className="text-xs text-gray-400">Free shipping on orders over $200</span>
                  </div>
                </div>
              )}
            </div>

            {navLinks.slice(1).map((link) => {
              const isActive = pathname.startsWith(link.href) && link.href !== '/';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    autoFocus
                    className="w-48 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="submit" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ml-1">
                    <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Account Menu */}
            <AccountMenu />

            {/* Cart Icon with Badge */}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-3">
            <form onSubmit={handleSearch} className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            <Link
              href="/"
              className={`block px-4 py-2 text-sm font-medium transition-colors ${
                pathname === '/' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            {/* Mobile Products with sub-items */}
            <div>
              <Link
                href="/products"
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/products') ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <div className="pl-4 border-l-2 border-gray-100 dark:border-gray-700 ml-4 mb-1">
                {MEGA_CATEGORIES.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="block px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href) && link.href !== '/'
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

