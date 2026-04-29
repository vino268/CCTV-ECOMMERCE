'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Instagram, Youtube, Phone, Mail, MapPin } from 'lucide-react';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

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
    fetch(buildApiUrl('/api/settings'))
      .then((r) => parseResponseBody(r))
     .then((data: any) => {
const payload = data?.data || data;
        setS({
          storeName: payload.storeName ?? '',
          description: payload.description ?? '',
          contact: {
            phone: payload.phone ?? payload.contact?.phone ?? '',
            email: payload.email ?? payload.contact?.email ?? '',
            address: payload.address ?? payload.contact?.address ?? '',
          },
          social: {
            facebook: payload.social?.facebook ?? '',
            instagram: payload.social?.instagram ?? '',
            twitter: payload.social?.twitter ?? '',
            linkedin: payload.social?.linkedin ?? '',
            youtube: payload.social?.youtube ?? '',
          },
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const socialLinks = [
    { href: s.social.instagram, icon: Instagram, label: 'Instagram' },
    { href: s.social.youtube, icon: Youtube, label: 'YouTube' },
  ];

  const companyName = 'TN Automation';
  const companyDescription =
    s.description ||
    'Smart ecommerce solutions for cameras, automation products, and reliable customer support.';

  if (!loaded) return null;

  return (
    <footer
      className="w-full text-white"
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
      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-7 px-4 py-7 sm:px-5 sm:py-8 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-10 md:px-6 md:py-9">
        {/* Company Info */}
        <div className="min-w-0 text-center md:flex md:min-h-[150px] md:flex-col md:justify-center md:text-left">
          <h3 className="mb-2 text-base font-semibold tracking-tight text-white sm:text-[17px]">
            {companyName}
          </h3>
          <p className="mx-auto mb-3 max-w-md text-[13px] leading-5 text-blue-100 md:mx-0 md:text-sm">
            {companyDescription}
          </p>
          <div className="flex items-center justify-center gap-2.5 md:justify-start">
            {socialLinks.map(
              (link) =>
                link.href && (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-blue-100 transition-all duration-200 hover:bg-white/25 hover:text-white"
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                )
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="min-w-0 text-center md:flex md:min-h-[150px] md:w-full md:max-w-[420px] md:flex-col md:items-center md:justify-center md:justify-self-start md:text-center">
          <h4 className="mb-3 w-full text-center text-sm font-semibold uppercase tracking-wide text-blue-100">
            Contact
          </h4>
          <ul className="flex w-full max-w-[340px] flex-col items-stretch space-y-2 text-[13px] sm:text-sm">
            {s.contact.address && (
              <li className="flex items-start justify-start gap-2 text-left text-blue-50">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                <span className="max-w-[300px] leading-5">{s.contact.address}</span>
              </li>
            )}
            {s.contact.phone && (
              <li className="flex items-center justify-start gap-2 text-left text-blue-50">
                <Phone className="h-4 w-4 shrink-0 text-blue-200" />
                <a
                  href={`tel:${s.contact.phone}`}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {s.contact.phone}
                </a>
              </li>
            )}
            {s.contact.email && (
              <li className="flex items-center justify-start gap-2 text-left text-blue-50">
                <Mail className="h-4 w-4 shrink-0 text-blue-200" />
                <a
                  href={`mailto:${s.contact.email}`}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {s.contact.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/20">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-2 px-4 py-3 text-[13px] text-blue-100 sm:px-5 sm:py-3.5 md:flex-row md:gap-4 md:px-6 md:text-sm">
          <p className="text-center md:text-left">&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-end">
            <Link href="/privacy" className="transition-colors hover:text-white hover:underline">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="transition-colors hover:text-white hover:underline">
              Refund Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white hover:underline">
              Terms
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
