'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

interface SiteSettings {
  storeName: string;
  storeDescription: string;
  phone: string;
  email: string;
  address: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

const DEFAULTS: SiteSettings = {
  storeName: 'TN Automation',
  storeDescription: 'Professional CCTV and security solutions for businesses and homes.',
  phone: '+1 (615) 555-1234',
  email: 'info@tnautomation.com',
  address: '123 Security Street, Nashville, TN 37201',
  socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '' },
};

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    fetch('/api/settings/site')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings({
            storeName: data.settings.storeName || DEFAULTS.storeName,
            storeDescription: data.settings.storeDescription || DEFAULTS.storeDescription,
            phone: data.settings.phone || DEFAULTS.phone,
            email: data.settings.email || DEFAULTS.email,
            address: data.settings.address || DEFAULTS.address,
            socialLinks: {
              facebook: data.settings.socialLinks?.facebook || '',
              instagram: data.settings.socialLinks?.instagram || '',
              twitter: data.settings.socialLinks?.twitter || '',
              linkedin: data.settings.socialLinks?.linkedin || '',
            },
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load site settings:', err);
      });
  }, []);

  const hasNoSocialLinks = !Object.values(settings.socialLinks).some((link) => link);

  return (
    <footer className="bg-secondary text-secondary-foreground mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">{settings.storeName}</h3>
            <p className="text-sm opacity-90 mb-6">{settings.storeDescription}</p>
            <div className="flex gap-4">
              {settings.socialLinks.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.twitter && (
                <a
                  href={settings.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.linkedin && (
                <a
                  href={settings.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {/* Show placeholder icons when no links are configured */}
              {hasNoSocialLinks && (
                  <>
                    <span className="hover:opacity-80 transition-opacity opacity-40" aria-label="Facebook">
                      <Facebook className="w-5 h-5" />
                    </span>
                    <span className="hover:opacity-80 transition-opacity opacity-40" aria-label="Twitter">
                      <Twitter className="w-5 h-5" />
                    </span>
                    <span className="hover:opacity-80 transition-opacity opacity-40" aria-label="Instagram">
                      <Instagram className="w-5 h-5" />
                    </span>
                    <span className="hover:opacity-80 transition-opacity opacity-40" aria-label="LinkedIn">
                      <Linkedin className="w-5 h-5" />
                    </span>
                  </>
                )}
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
              {settings.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:opacity-80 transition-opacity">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:opacity-80 transition-opacity">
                    {settings.email}
                  </a>
                </li>
              )}
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
