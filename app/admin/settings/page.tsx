'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  phone: '',
  email: '',
  address: '',
  socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '' },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings/site')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings({
            storeName: data.settings.storeName || DEFAULTS.storeName,
            storeDescription: data.settings.storeDescription || DEFAULTS.storeDescription,
            phone: data.settings.phone || '',
            email: data.settings.email || '',
            address: data.settings.address || '',
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

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/settings/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg('Settings saved successfully.');
      } else {
        setSaveMsg('Failed to save settings.');
      }
    } catch {
      setSaveMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

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
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Store Description
            </label>
            <textarea
              value={settings.storeDescription}
              onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Address
            </label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </div>
      </Card>

      {/* Social Media Links */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Social Media Links
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Facebook URL
            </label>
            <input
              type="url"
              value={settings.socialLinks.facebook}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, facebook: e.target.value },
                })
              }
              placeholder="https://facebook.com/yourpage"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Instagram URL
            </label>
            <input
              type="url"
              value={settings.socialLinks.instagram}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, instagram: e.target.value },
                })
              }
              placeholder="https://instagram.com/yourprofile"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Twitter / X URL
            </label>
            <input
              type="url"
              value={settings.socialLinks.twitter}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, twitter: e.target.value },
                })
              }
              placeholder="https://twitter.com/yourhandle"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={settings.socialLinks.linkedin}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, linkedin: e.target.value },
                })
              }
              placeholder="https://linkedin.com/company/yourcompany"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        {saveMsg && (
          <span
            className={`text-sm ${
              saveMsg.includes('success') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {saveMsg}
          </span>
        )}
      </div>

      {/* Shipping Settings */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Shipping Settings
        </h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Free Shipping Threshold
              </label>
              <div className="flex items-center gap-2">
                <span className="text-foreground">$</span>
                <input
                  type="number"
                  defaultValue="100"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Standard Shipping Cost
              </label>
              <div className="flex items-center gap-2">
                <span className="text-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  defaultValue="9.99"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          <Button>Save Changes</Button>
        </div>
      </Card>

      {/* Tax Settings */}
      <Card className="p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Tax Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              defaultValue="8"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <Button>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}
