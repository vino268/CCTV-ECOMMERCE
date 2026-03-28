'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [s, setS] = useState<Settings>(fallback);
  const [loaded, setLoaded] = useState(false);

  const handleAdminAccess = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    } catch {
      // Ignore localStorage access issues in restricted environments.
    }

    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors and still proceed to login.
    }

    router.push('/admin/login');
  };

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
    <footer
      className="w-full mt-10 text-white"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #7c3aed)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Overlay for extra depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(rgba(30,58,138,0.85), rgba(124,58,237,0.85))',
          zIndex: 0,
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-20 py-16 flex flex-col md:flex-row gap-12 md:gap-24 items-start justify-between">
        {/* Company Info */}
        <div className="flex-1 min-w-[220px] text-center md:text-left">
          {s.storeName && <h3 className="text-2xl font-bold mb-4 tracking-tight text-white drop-shadow-lg">{s.storeName}</h3>}
          {s.description && (
            <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-sm mx-auto md:mx-0">
              {s.description}
            </p>
          )}
          <div className="flex gap-4 mt-2 justify-center md:justify-start">
            {socialLinks.map(
              (link) =>
                link.href && (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white shadow-md transition-all duration-200 hover:shadow-blue-400/40"
                  >
                    <link.icon className="h-5 w-5" />
                  </a>
                )
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="flex-1 min-w-[220px] text-center md:text-left">
          <h4 className="text-base font-semibold uppercase tracking-wider text-blue-100 mb-5 border-b border-blue-200/30 pb-2">
            Contact Us
          </h4>
          <ul className="space-y-4 text-base">
            {s.contact.address && (
              <li className="flex items-start justify-center md:justify-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-200" />
                <span className="text-blue-50">{s.contact.address}</span>
              </li>
            )}
            {s.contact.phone && (
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-blue-200" />
                <a
                  href={`tel:${s.contact.phone}`}
                  className="text-blue-50 hover:text-white transition-colors duration-200"
                >
                  {s.contact.phone}
                </a>
              </li>
            )}
            {s.contact.email && (
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-blue-200" />
                <a
                  href={`mailto:${s.contact.email}`}
                  className="text-blue-50 hover:text-white transition-colors duration-200"
                >
                  {s.contact.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-blue-200/30">
        <div className="max-w-7xl mx-auto px-6 md:px-20 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-blue-100">
          <p className="tracking-wide text-center md:text-left">&copy; {new Date().getFullYear()} {s.storeName}. All rights reserved.</p>
          <div className="flex items-center gap-7 flex-wrap justify-center md:justify-end">
            <Link href="/privacy" className="hover:text-white hover:underline transition-colors">
              Privacy Policy
            </Link>
            <span className="h-4 w-px bg-blue-200/30 mx-2 hidden md:inline-block"></span>
            <Link href="/refund-policy" className="hover:text-white hover:underline transition-colors">
              Refund Policy
            </Link>
            <span className="h-4 w-px bg-blue-200/30 mx-2 hidden md:inline-block"></span>
            <Link href="/terms" className="hover:text-white hover:underline transition-colors">
              Terms of Service
            </Link>

            <div className="relative group/admin-secret select-none">
              <span className="inline-block h-3 w-3 opacity-0" aria-hidden="true" />
              <Link
                href="/admin/login"
                onClick={handleAdminAccess}
                aria-label="Admin Login"
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-0 translate-y-2 group-hover/admin-secret:pointer-events-auto group-hover/admin-secret:opacity-100 group-hover/admin-secret:translate-y-0 transition-all duration-300 text-xs text-gray-400 hover:text-white whitespace-nowrap"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
