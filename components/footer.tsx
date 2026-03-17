'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Phone, Mail, MapPin } from 'lucide-react';

type Settings = {
  storeName: string;
  description: string;
  contact: { phone: string; email: string; address: string };
  social: { facebook: string; instagram: string; twitter: string; linkedin: string; youtube: string };
};

const fallback: Settings = {
  storeName: '',
  description: '',
  contact: { phone: '', email: '', address: '' },
  social: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
};

export function Footer() {
  const [s, setS] = useState<Settings>(fallback);
  const [loaded, setLoaded] = useState(false);
  const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/sitemap', label: 'Sitemap' },
    { href: '/admin/login', label: 'Admin Login' },
  ];

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setS({
          storeName: data.storeName ?? '',
          description: data.description ?? '',
          contact: {
            phone: data.contact?.phone ?? '',
            email: data.contact?.email ?? '',
            address: data.contact?.address ?? '',
          },
          social: {
            facebook: data.social?.facebook ?? '',
            instagram: data.social?.instagram ?? '',
            twitter: data.social?.twitter ?? '',
            linkedin: data.social?.linkedin ?? '',
            youtube: data.social?.youtube ?? '',
          },
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const socialLinks = [
    { href: s.social.facebook, icon: Facebook, label: 'Facebook' },
    { href: s.social.instagram, icon: Instagram, label: 'Instagram' },
    { href: s.social.twitter, icon: Twitter, label: 'Twitter' },
    { href: s.social.linkedin, icon: Linkedin, label: 'LinkedIn' },
    { href: s.social.youtube, icon: Youtube, label: 'YouTube' },
  ];

  if (!loaded) return null;

  return (
    <footer className="bg-blue-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1 — Brand */}
          <div>
            {s.storeName && <h3 className="text-xl font-bold mb-3">{s.storeName}</h3>}
            {s.description && (
              <p className="text-blue-200 text-sm leading-relaxed mb-5">
                {s.description}
              </p>
            )}
            <div className="flex gap-3">
              {socialLinks.map(
                (link) =>
                  link.href && (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-blue-200 transition-colors hover:bg-white hover:text-blue-900"
                    >
                      <link.icon className="h-4 w-4" />
                    </a>
                  )
              )}
            </div>
          </div>

          {/* Column 2 — Products */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-300 mb-4">
              Products
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Dome Cameras', cat: 'dome' },
                { label: 'Bullet Cameras', cat: 'bullet' },
                { label: 'PTZ Cameras', cat: 'ptz' },
                { label: 'Thermal Cameras', cat: 'thermal' },
                { label: 'Recorders', cat: 'storage' },
              ].map((p) => (
                <li key={p.cat}>
                  <Link
                    href={`/products?category=${p.cat}`}
                    className="text-blue-100 hover:text-white transition-colors"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Services */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-300 mb-4">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              {['Installation', 'Consultation', 'Maintenance', 'Support'].map(
                (svc) => (
                  <li key={svc}>
                    <Link
                      href="/services"
                      className="text-blue-100 hover:text-white transition-colors"
                    >
                      {svc}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Column 4 — Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-300 mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm">
              {s.contact.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-300" />
                  <span className="text-blue-100">{s.contact.address}</span>
                </li>
              )}
              {s.contact.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 flex-shrink-0 text-blue-300" />
                  <a
                    href={`tel:${s.contact.phone}`}
                    className="text-blue-100 hover:text-white transition-colors"
                  >
                    {s.contact.phone}
                  </a>
                </li>
              )}
              {s.contact.email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 flex-shrink-0 text-blue-300" />
                  <a
                    href={`mailto:${s.contact.email}`}
                    className="text-blue-100 hover:text-white transition-colors"
                  >
                    {s.contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-800">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-blue-300">
          <p>&copy; {new Date().getFullYear()} {s.storeName}. All rights reserved.</p>
          <div className="flex w-full justify-end gap-6 text-sm md:w-auto">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.href === '/admin/login'
                    ? 'opacity-30 text-blue-200 hover:opacity-100 hover:text-white transition duration-300'
                    : 'hover:text-white transition-colors'
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
