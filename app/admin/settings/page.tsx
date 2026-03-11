'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type SiteSettings = {
  storeName: string;
  description: string;
  contact: { phone: string; email: string; address: string };
  social: { facebook: string; instagram: string; twitter: string; linkedin: string; youtube: string };
};

const defaultSettings: SiteSettings = {
  storeName: '',
  description: '',
  contact: { phone: '', email: '', address: '' },
  social: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
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
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setStatus('Settings saved successfully');
    } catch {
      setStatus('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage system settings</p>
      </div>

      {/* Store Information */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Store Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) =>
                setSettings({ ...settings, storeName: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Store Description
            </label>
            <textarea
              value={settings.description}
              onChange={(e) =>
                setSettings({ ...settings, description: e.target.value })
              }
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Contact Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.contact.phone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact: { ...settings.contact, phone: e.target.value },
                })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.contact.email}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact: { ...settings.contact, email: e.target.value },
                })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Business Address
            </label>
            <textarea
              value={settings.contact.address}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact: { ...settings.contact, address: e.target.value },
                })
              }
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      {/* Footer / Social Media Settings */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Footer Settings
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Social media links displayed in the storefront footer.
        </p>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Facebook URL
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                value={settings.social.facebook}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, facebook: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={settings.social.instagram}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, instagram: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Twitter URL
              </label>
              <input
                type="url"
                placeholder="https://twitter.com/..."
                value={settings.social.twitter}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, twitter: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/..."
                value={settings.social.linkedin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, linkedin: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/..."
                value={settings.social.youtube}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, youtube: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
        {status && (
          <span
            className={`text-sm ${
              status.includes('success')
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
