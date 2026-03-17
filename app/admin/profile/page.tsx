'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Shield, Calendar, Save, Loader2 } from 'lucide-react';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors';

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile', { cache: 'no-store' });
        const data = await res.json();

        if (data.success) {
          setAdmin(data.admin);
          setName(data.admin.name || '');
          setEmail(data.admin.email || '');
          setPhone(data.admin.phone || '');
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
        setAdmin(data.admin);
        // Update localStorage
        const stored = localStorage.getItem('adminInfo');
        if (stored) {
          const adminData = JSON.parse(stored);
          adminData.name = data.admin.name;
          adminData.email = data.admin.email;
          adminData.phone = data.admin.phone;
          localStorage.setItem('adminInfo', JSON.stringify(adminData));
        }
        setMessage({ type: 'success', text: 'Profile updated successfully' });

        // Log activity
        await fetch('/api/admin/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'Updated profile', adminName: name || email }),
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Profile</h1>

      {/* Profile Info Card */}
      {admin && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(admin.name || admin.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{admin.name || 'Admin'}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-3.5 h-3.5" />
                {admin.role || 'admin'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Name
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className={inputClass}
            />
          </div>

          <Button type="submit" className="gap-2" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
