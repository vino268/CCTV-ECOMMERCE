'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type StoreSettings = {
  storeInformation: {
    storeName: string;
    phoneNumber: string;
    email: string;
    businessAddress: string;
  };
  shippingSettings: {
    freeShippingThreshold: number;
    standardShippingCost: number;
  };
  paymentSettings: {
    cashOnDelivery: boolean;
    upi: boolean;
    onlinePayment: boolean;
  };
  footer: {
    description: string;
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    address: string;
    phone: string;
    email: string;
  };
  maintenanceMode: {
    enabled: boolean;
  };
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeInformation: {
    storeName: '',
    phoneNumber: '',
    email: '',
    businessAddress: '',
  },
  shippingSettings: {
    freeShippingThreshold: 0,
    standardShippingCost: 0,
  },
  paymentSettings: {
    cashOnDelivery: true,
    upi: true,
    onlinePayment: true,
  },
  footer: {
    description: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    address: '',
    phone: '',
    email: '',
  },
  maintenanceMode: {
    enabled: false,
  },
};

const cardClass = 'bg-white rounded-xl shadow-sm p-6 border border-border';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const setMessage = (message: string, isError = false) => {
    setStatusMessage(message);
    setStatusError(isError);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, paymentRes] = await Promise.all([
        fetch('/api/admin/settings', { cache: 'no-store' }),
        fetch('/api/settings/payment', { cache: 'no-store' }),
      ]);

      if (!settingsRes.ok) throw new Error('Failed to fetch settings');
      const data = await settingsRes.json();

      const paymentData = paymentRes.ok
        ? await paymentRes.json()
        : DEFAULT_SETTINGS.paymentSettings;

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
        storeInformation: { ...DEFAULT_SETTINGS.storeInformation, ...data.storeInformation },
        shippingSettings: {
          ...DEFAULT_SETTINGS.shippingSettings,
          ...data.shippingSettings,
        },
        paymentSettings: {
          ...DEFAULT_SETTINGS.paymentSettings,
          ...paymentData,
        },
        footer: {
          ...DEFAULT_SETTINGS.footer,
          ...data.footer,
        },
        maintenanceMode: { ...DEFAULT_SETTINGS.maintenanceMode, ...data.maintenanceMode },
      });
    } catch (error) {
      console.error(error);
      setMessage('Unable to load settings. Please refresh the page.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateNestedField = <K extends keyof StoreSettings>(
    section: K,
    field: keyof StoreSettings[K],
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      const paymentRes = await fetch('/api/admin/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.paymentSettings),
      });

      if (!paymentRes.ok) throw new Error('Failed to save payment settings');

      const footerRes = await fetch('/api/admin/settings/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.footer),
      });

      if (!footerRes.ok) throw new Error('Failed to save footer settings');

      const updated = await res.json();
      const updatedPayment = await paymentRes.json();
      const updatedFooter = await footerRes.json();
      setSettings({
        ...DEFAULT_SETTINGS,
        ...updated,
        storeInformation: {
          ...DEFAULT_SETTINGS.storeInformation,
          ...updated.storeInformation,
        },
        shippingSettings: {
          ...DEFAULT_SETTINGS.shippingSettings,
          ...updated.shippingSettings,
        },
        paymentSettings: {
          ...DEFAULT_SETTINGS.paymentSettings,
          ...updatedPayment,
        },
        footer: {
          ...DEFAULT_SETTINGS.footer,
          ...updatedFooter,
        },
        maintenanceMode: {
          ...DEFAULT_SETTINGS.maintenanceMode,
          ...updated.maintenanceMode,
        },
      });
      setMessage('Settings saved successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Failed to save settings.', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {statusMessage ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            statusError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      {/* SECTION 1: STORE INFORMATION */}
      <section className={cardClass}>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Store Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Store Name</label>
            <Input
              value={settings.storeInformation.storeName}
              onChange={(e) => updateNestedField('storeInformation', 'storeName', e.target.value)}
              placeholder="Your store name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Phone Number</label>
            <Input
              value={settings.storeInformation.phoneNumber}
              onChange={(e) =>
                updateNestedField('storeInformation', 'phoneNumber', e.target.value)
              }
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              value={settings.storeInformation.email}
              onChange={(e) => updateNestedField('storeInformation', 'email', e.target.value)}
              placeholder="contact@store.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">Business Address</label>
            <Textarea
              rows={3}
              value={settings.storeInformation.businessAddress}
              onChange={(e) =>
                updateNestedField('storeInformation', 'businessAddress', e.target.value)
              }
              placeholder="Street address, City, State, Zip code"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: SHIPPING SETTINGS */}
      <section className={cardClass}>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Shipping Settings</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Logic: If order total ≥ Free Shipping Threshold → Delivery charge = 0, Else → Delivery charge = Standard Shipping Cost
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Free Shipping Threshold (₹)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={settings.shippingSettings.freeShippingThreshold}
              onChange={(e) =>
                updateNestedField(
                  'shippingSettings',
                  'freeShippingThreshold',
                  Number(e.target.value)
                )
              }
              placeholder="0"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Orders above this amount get free shipping
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Standard Shipping Cost (₹)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={settings.shippingSettings.standardShippingCost}
              onChange={(e) =>
                updateNestedField(
                  'shippingSettings',
                  'standardShippingCost',
                  Number(e.target.value)
                )
              }
              placeholder="0"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Charged when order is below threshold
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: PAYMENT SETTINGS */}
      <section className={cardClass}>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Payment Settings</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Enable the payment methods available to customers
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span className="text-sm font-medium">Cash On Delivery</span>
            <Switch
              checked={settings.paymentSettings.cashOnDelivery}
              onCheckedChange={(checked) =>
                updateNestedField('paymentSettings', 'cashOnDelivery', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span className="text-sm font-medium">UPI</span>
            <Switch
              checked={settings.paymentSettings.upi}
              onCheckedChange={(checked) =>
                updateNestedField('paymentSettings', 'upi', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span className="text-sm font-medium">Online Payment</span>
            <Switch
              checked={settings.paymentSettings.onlinePayment}
              onCheckedChange={(checked) =>
                updateNestedField('paymentSettings', 'onlinePayment', checked)
              }
            />
          </div>
        </div>
      </section>

      {/* SECTION 4: MAINTENANCE MODE */}
      <section className={cardClass}>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Maintenance Mode</h2>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Enable Maintenance Mode</p>
            <p className="text-xs text-muted-foreground">
              All storefront pages will show "Website under maintenance" message
            </p>
          </div>
          <Switch
            checked={settings.maintenanceMode.enabled}
            onCheckedChange={(checked) =>
              updateNestedField('maintenanceMode', 'enabled', checked)
            }
          />
        </div>
      </section>

      {/* SECTION 5: FOOTER SETTINGS */}
      <section className={cardClass}>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Footer Settings</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Manage company description, social links, and contact details shown in website footer
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">Company Description</label>
            <Textarea
              rows={4}
              value={settings.footer.description}
              onChange={(e) => updateNestedField('footer', 'description', e.target.value)}
              placeholder="Professional CCTV and security solutions for businesses and homes."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Facebook URL</label>
            <Input
              value={settings.footer.facebook}
              onChange={(e) => updateNestedField('footer', 'facebook', e.target.value)}
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Twitter URL</label>
            <Input
              value={settings.footer.twitter}
              onChange={(e) => updateNestedField('footer', 'twitter', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Instagram URL</label>
            <Input
              value={settings.footer.instagram}
              onChange={(e) => updateNestedField('footer', 'instagram', e.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">LinkedIn URL</label>
            <Input
              value={settings.footer.linkedin}
              onChange={(e) => updateNestedField('footer', 'linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">Contact Address</label>
            <Input
              value={settings.footer.address}
              onChange={(e) => updateNestedField('footer', 'address', e.target.value)}
              placeholder="123 Security Street, Nashville, TN 37201"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Contact Phone</label>
            <Input
              value={settings.footer.phone}
              onChange={(e) => updateNestedField('footer', 'phone', e.target.value)}
              placeholder="+1 (615) 555-1234"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Contact Email</label>
            <Input
              type="email"
              value={settings.footer.email}
              onChange={(e) => updateNestedField('footer', 'email', e.target.value)}
              placeholder="info@tnautomation.com"
            />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </section>
    </div>
  );
}
