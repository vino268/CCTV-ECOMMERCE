'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type SiteSettings = {
  storeName: string;
  description: string;
  contact: { phone: string; email: string; address: string };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
};

type ValidationErrors = Partial<Record<string, string>>;

const defaultSettings: SiteSettings = {
  storeName: '',
  description: '',
  contact: { phone: '', email: '', address: '' },
  social: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
};

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpsUrl(value: string) {
  if (!value.trim()) return true;
  if (!value.startsWith('https://')) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function InputWithIcon({
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-10`}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setSettings({
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
      })
      .catch(() => {
        setStatus({ type: 'error', message: 'Failed to load settings' });
      })
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const nextErrors: ValidationErrors = {};

    if (settings.contact.email.trim() && !isValidEmail(settings.contact.email.trim())) {
      nextErrors.contactEmail = 'Enter a valid email address.';
    }

    if (settings.contact.phone.trim() && !/^\d+$/.test(settings.contact.phone.trim())) {
      nextErrors.contactPhone = 'Phone must contain only numbers.';
    }

    const socialFields: Array<keyof SiteSettings['social']> = [
      'facebook',
      'instagram',
      'twitter',
      'linkedin',
      'youtube',
    ];

    socialFields.forEach((field) => {
      const value = settings.social[field].trim();
      if (!isValidHttpsUrl(value)) {
        nextErrors[`social-${field}`] = 'URL must start with https://';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    setStatus(null);
    if (!validate()) {
      setStatus({ type: 'error', message: 'Please fix validation errors before saving.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setStatus({ type: 'success', message: 'Settings saved successfully' });
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => {
        setStatus((prev) => (prev?.type === 'success' ? null : prev));
      }, 2500);
    }
  };

  const onSocialChange = (key: keyof SiteSettings['social'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        [key]: value,
      },
    }));
    setErrors((prev) => ({ ...prev, [`social-${key}`]: '' }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Configure your store information and footer links.</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {status && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
            status.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {status.message}
        </div>
      )}

      <Tabs defaultValue="general" className="gap-6">
        <TabsList className="bg-white border border-gray-200 rounded-xl p-1">
          <TabsTrigger value="general" className="px-4">General</TabsTrigger>
          <TabsTrigger value="contact" className="px-4">Contact</TabsTrigger>
          <TabsTrigger value="footer" className="px-4">Footer / Social Links</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-white shadow-sm rounded-xl p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Store Name</label>
              <p className="text-xs text-gray-500 mb-2">Displayed in the header, title areas, and branding sections.</p>
              <InputWithIcon
                icon={<Building2 className="w-4 h-4" />}
                value={settings.storeName}
                onChange={(value) => setSettings((prev) => ({ ...prev, storeName: value }))}
                placeholder="Enter store name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Store Description</label>
              <p className="text-xs text-gray-500 mb-2">Short description shown on landing pages and SEO snippets.</p>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FileText className="w-4 h-4" />
                </span>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe your store and value proposition"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact">
          <div className="bg-white shadow-sm rounded-xl p-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
              <p className="text-xs text-gray-500 mb-2">Numbers only. Used for customer support contact.</p>
              <InputWithIcon
                icon={<Phone className="w-4 h-4" />}
                value={settings.contact.phone}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone: value },
                  }));
                  setErrors((prev) => ({ ...prev, contactPhone: '' }));
                }}
                placeholder="9876543210"
              />
              {errors.contactPhone && (
                <p className="text-xs text-red-600 mt-1">{errors.contactPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
              <p className="text-xs text-gray-500 mb-2">Main support email shown to customers.</p>
              <InputWithIcon
                icon={<Mail className="w-4 h-4" />}
                value={settings.contact.email}
                onChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, email: value },
                  }));
                  setErrors((prev) => ({ ...prev, contactEmail: '' }));
                }}
                placeholder="support@yourstore.com"
                type="email"
              />
              {errors.contactEmail && (
                <p className="text-xs text-red-600 mt-1">{errors.contactEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Address</label>
              <p className="text-xs text-gray-500 mb-2">Physical address used in footer and contact pages.</p>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea
                  value={settings.contact.address}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, address: e.target.value },
                    }))
                  }
                  rows={3}
                  placeholder="Enter complete business address"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="footer">
          <div className="bg-white shadow-sm rounded-xl p-5 space-y-5">
            <p className="text-sm text-gray-500">All social links must start with https://</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Facebook</label>
                <InputWithIcon
                  icon={<Facebook className="w-4 h-4" />}
                  value={settings.social.facebook}
                  onChange={(value) => onSocialChange('facebook', value)}
                  placeholder="https://facebook.com/your-page"
                />
                {errors['social-facebook'] && <p className="text-xs text-red-600 mt-1">{errors['social-facebook']}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Instagram</label>
                <InputWithIcon
                  icon={<Instagram className="w-4 h-4" />}
                  value={settings.social.instagram}
                  onChange={(value) => onSocialChange('instagram', value)}
                  placeholder="https://instagram.com/your-page"
                />
                {errors['social-instagram'] && <p className="text-xs text-red-600 mt-1">{errors['social-instagram']}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Twitter</label>
                <InputWithIcon
                  icon={<Twitter className="w-4 h-4" />}
                  value={settings.social.twitter}
                  onChange={(value) => onSocialChange('twitter', value)}
                  placeholder="https://twitter.com/your-page"
                />
                {errors['social-twitter'] && <p className="text-xs text-red-600 mt-1">{errors['social-twitter']}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">LinkedIn</label>
                <InputWithIcon
                  icon={<Linkedin className="w-4 h-4" />}
                  value={settings.social.linkedin}
                  onChange={(value) => onSocialChange('linkedin', value)}
                  placeholder="https://linkedin.com/company/your-page"
                />
                {errors['social-linkedin'] && <p className="text-xs text-red-600 mt-1">{errors['social-linkedin']}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">YouTube</label>
                <InputWithIcon
                  icon={<Youtube className="w-4 h-4" />}
                  value={settings.social.youtube}
                  onChange={(value) => onSocialChange('youtube', value)}
                  placeholder="https://youtube.com/@your-channel"
                />
                {errors['social-youtube'] && <p className="text-xs text-red-600 mt-1">{errors['social-youtube']}</p>}
              </div>

            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-4 right-4 z-30 md:hidden">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
