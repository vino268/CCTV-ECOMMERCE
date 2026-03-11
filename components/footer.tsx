"use client";

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

type FooterSettings = {
  description: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  address: string;
  phone: string;
  email: string;
};

const DEFAULT_FOOTER: FooterSettings = {
  description: 'Professional CCTV and security solutions for businesses and homes.',
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  address: '123 Security Street, Nashville, TN 37201',
  phone: '+1 (615) 555-1234',
  email: 'info@tnautomation.com',
};

export function Footer() {
  const [footer, setFooter] = useState<FooterSettings>(DEFAULT_FOOTER);

  useEffect(() => {
    let mounted = true;

    const fetchFooterSettings = async () => {
      try {
        const res = await fetch('/api/settings/footer', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        if (!mounted) return;

        setFooter({
          ...DEFAULT_FOOTER,
          ...data,
        });
      } catch (_error) {
        // Keep default values if API fails
      }
    };

    fetchFooterSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const socialLinks = [
    { key: 'facebook', href: footer.facebook, icon: Facebook, label: 'Facebook' },
    { key: 'twitter', href: footer.twitter, icon: Twitter, label: 'Twitter' },
    { key: 'instagram', href: footer.instagram, icon: Instagram, label: 'Instagram' },
    { key: 'linkedin', href: footer.linkedin, icon: Linkedin, label: 'LinkedIn' },
  ].filter((item) => item.href);

  return (
    <footer className="bg-secondary text-secondary-foreground mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">TN Automation</h3>
            <p className="text-sm opacity-90 mb-6">
              {footer.description}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className="hover:opacity-80 transition-opacity"
                    aria-label={item.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products?category=dome" className="hover:opacity-80 transition-opacity">
                  Dome Cameras
                </Link>
              </li>
              <li>
                <Link href="/products?category=bullet" className="hover:opacity-80 transition-opacity">
                  Bullet Cameras
                </Link>
              </li>
              <li>
                <Link href="/products?category=ptz" className="hover:opacity-80 transition-opacity">
                  PTZ Cameras
                </Link>
              </li>
              <li>
                <Link href="/products?category=thermal" className="hover:opacity-80 transition-opacity">
                  Thermal Cameras
                </Link>
              </li>
              <li>
                <Link href="/products?category=storage" className="hover:opacity-80 transition-opacity">
                  Recorders
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services" className="hover:opacity-80 transition-opacity">
                  Installation
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:opacity-80 transition-opacity">
                  Consultation
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:opacity-80 transition-opacity">
                  Maintenance
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:opacity-80 transition-opacity">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{footer.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href={`tel:${footer.phone}`} className="hover:opacity-80 transition-opacity">
                  {footer.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href={`mailto:${footer.email}`} className="hover:opacity-80 transition-opacity">
                  {footer.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-secondary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm opacity-75">
            <p>&copy; 2026 TN Automation. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0 items-center">
              <Link href="#" className="hover:opacity-100 transition-opacity">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:opacity-100 transition-opacity">
                Terms of Service
              </Link>
              <Link href="#" className="hover:opacity-100 transition-opacity">
                Sitemap
              </Link>
              <Link
                href="/admin/login"
                className="text-xs text-secondary-foreground/40 hover:text-blue-500 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
