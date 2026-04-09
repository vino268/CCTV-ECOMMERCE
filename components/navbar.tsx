'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/contexts/cart-context';
import { useWishlist } from '@/lib/contexts/wishlist-context';
import { ShoppingCart, Menu, X, Search, Heart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AccountMenu } from '@/components/account-menu';

export function Navbar() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const clickCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push('/products');
      return;
    }
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push('/products');
      return;
    }
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleLogoSecretClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    clickCountRef.current += 1;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    if (clickCountRef.current >= 5) {
      event.preventDefault();
      clickCountRef.current = 0;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const forceAdminLogin = async () => {
        try {
          await fetch(`${API_BASE}/api/admin/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch {
          // Ignore network errors and still proceed to login.
        }

        router.push('/admin/login');
      };

      void forceAdminLogin();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-white shadow-sm border-b border-gray-100 overflow-visible">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <div className="flex items-center justify-between w-full py-2.5 min-h-[72px] gap-2">
          {/* Logo */}
          <Link
            href="/"
            onClick={handleLogoSecretClick}
            className="flex items-center gap-2 flex-shrink-0 min-w-0"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Image
                src="/images/tnlogo.png"
                alt="TN Automation"
                width={50}
                height={50}
                className="h-10 w-auto object-contain mix-blend-multiply"
                priority
              />
              <span className="hidden sm:block text-blue-600 font-bold text-xl tracking-wide whitespace-nowrap">TN AUTOMATION</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 sm:gap-4 whitespace-nowrap flex-shrink-0">
            {/* Search */}
            <div className="relative hidden md:flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search products..."
                    autoFocus
                    className="w-40 lg:w-48 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="submit"
                    className="p-2 hover:bg-muted rounded-lg transition-colors ml-1"
                  >
                    <Search className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Search className="w-5 h-5 text-foreground" />
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Toggle mobile menu"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>

            {/* Account Menu */}
            <AccountMenu />

            {/* Wishlist Icon with Badge */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Heart className="w-5 h-5 text-foreground" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon with Badge */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
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
