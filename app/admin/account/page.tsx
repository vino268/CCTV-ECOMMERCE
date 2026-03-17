'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Settings, Loader2, CheckCircle } from 'lucide-react';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors';

export default function AccountSettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch('/api/admin/profile', { cache: 'no-store' });
        const data = await res.json();

        if (data.success) {
          setName(data.admin.name || '');
          setEmail(data.admin.email || '');
          setPhone(data.admin.phone || '');
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load account info' });
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await res.json();

      if (data.success) {
        const stored = localStorage.getItem('adminInfo');
        if (stored) {
          const adminData = JSON.parse(stored);
          adminData.name = data.admin.name;
          adminData.email = data.admin.email;
          adminData.phone = data.admin.phone;
          localStorage.setItem('adminInfo', JSON.stringify(adminData));
        }
        setMessage({ type: 'success', text: 'Account updated successfully' });

        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'Updated account settings', adminName: name || email }),
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
      <p className="text-gray-500 mb-6">Update your account information</p>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            <p className="text-xs text-gray-500">
              Update your name, email and phone number
            </p>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1.5">
              <User className="w-4 h-4 text-gray-400" />
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1.5">
              <Mail className="w-4 h-4 text-gray-400" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1.5">
              <Phone className="w-4 h-4 text-gray-400" />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className={inputClass}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
