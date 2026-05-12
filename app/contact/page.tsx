"use client";

import { useEffect, useState } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

type BusinessHours = {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
};

type ContactInfo = {
  phone?: string;
  email?: string;
  address?: string;
  businessHours?: BusinessHours;
};

function normalizeHoursValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatBusinessHours(hours?: BusinessHours): string[] {
  if (!hours) {
    return [];
  }

  const monday = normalizeHoursValue(hours.monday);
  const tuesday = normalizeHoursValue(hours.tuesday);
  const wednesday = normalizeHoursValue(hours.wednesday);
  const thursday = normalizeHoursValue(hours.thursday);
  const friday = normalizeHoursValue(hours.friday);
  const saturday = normalizeHoursValue(hours.saturday);
  const sunday = normalizeHoursValue(hours.sunday);

  const hasAnyHours = [
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
  ].some(Boolean);

  if (!hasAnyHours) {
    return [];
  }

  const weekdayValues = [monday, tuesday, wednesday, thursday, friday];
  const weekdaysUniform = weekdayValues.every((value) => value && value === monday);

  const lines: string[] = [];

  if (weekdaysUniform) {
    lines.push(`Mon - Fri: ${monday}`);
  } else {
    lines.push(`Monday: ${monday || 'Not available'}`);
    lines.push(`Tuesday: ${tuesday || 'Not available'}`);
    lines.push(`Wednesday: ${wednesday || 'Not available'}`);
    lines.push(`Thursday: ${thursday || 'Not available'}`);
    lines.push(`Friday: ${friday || 'Not available'}`);
  }

  lines.push(`Saturday: ${saturday || 'Not available'}`);
  lines.push(`Sunday: ${sunday || 'Not available'}`);

  return lines;
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [settings, setSettings] = useState<ContactInfo | null>(null);
  const [loadingContact, setLoadingContact] = useState(true);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/settings'), { cache: 'no-store', credentials: 'include' });
        const data = await parseResponseBody<any>(res);

        if (!res.ok) {
          setSettings(null);
          return;
        }

        const payload = data?.data || data;

        setSettings({
          phone: payload?.phone ?? payload?.contact?.phone ?? '',
          email: payload?.email ?? payload?.contact?.email ?? '',
          address: payload?.address ?? payload?.contact?.address ?? '',
          businessHours:
            payload?.businessHours && typeof payload.businessHours === 'object'
              ? payload.businessHours
              : undefined,
        });
      } catch {
        setSettings(null);
      } finally {
        setLoadingContact(false);
      }
    };

    fetchContact();
  }, []);

  const businessHoursLines = formatBusinessHours(settings?.businessHours);

  useEffect(() => {
    console.log(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch(buildApiUrl('/api/send-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const successMessage = data.message || 'Message sent successfully';
        toast.success(successMessage);
        setStatus({ type: 'success', message: successMessage });
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        const errorMessage = data.message || 'Failed to send message';
        toast.error(errorMessage);
        setStatus({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast.error('Failed to send message');
      setStatus({ type: 'error', message: 'Failed to send message' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Contact Us</h1>
          <p className="mt-3 text-gray-600 text-base md:text-lg">
            Have a question about products or installation? Our team is here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 md:p-7 w-full flex flex-col gap-5">
            <h2 className="text-2xl font-semibold text-gray-900">Send us a Message</h2>

            {status && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  status.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <form className="space-y-4 pt-1" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <textarea
                rows={5}
                name="message"
                placeholder="Message"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-300"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6 md:p-7 w-full flex flex-col gap-5">
            <h2 className="text-2xl font-semibold text-gray-900">Contact Details</h2>

            <div className="space-y-5 pt-1">
              <div className="group flex items-start gap-3 text-gray-700 p-3 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300">
                <Phone className="w-5 h-5 mt-0.5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
                <div>
                  <p className="font-semibold text-gray-900">PHONE</p>
                  {settings?.phone ? (
                    <a href={`tel:${settings.phone}`} className="text-gray-700 hover:text-blue-600 transition">
                      {settings.phone}
                    </a>
                  ) : (
                    <p className="text-gray-500">Not available</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="group flex items-start gap-3 text-gray-700 p-3 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300">
                <Mail className="w-5 h-5 mt-0.5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
                <div>
                  <p className="font-semibold text-gray-900">EMAIL</p>
                  {settings?.email ? (
                    <a href={`mailto:${settings.email}`} className="text-gray-700 hover:text-blue-600 transition">
                      {settings.email}
                    </a>
                  ) : (
                    <p className="text-gray-500">Not available</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="group flex items-start gap-3 text-gray-700 p-3 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300">
                <MapPin className="w-5 h-5 mt-0.5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
                <div>
                  <p className="font-semibold text-gray-900">ADDRESS</p>
                  {settings?.address ? (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{settings.address}</p>
                  ) : (
                    <p className="text-gray-500">Not available</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-lg">Business Hours</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Monday</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tuesday</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wednesday</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thursday</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Friday</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}