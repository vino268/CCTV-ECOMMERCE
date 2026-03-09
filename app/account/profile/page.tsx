'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Save, User } from 'lucide-react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dob: string | null;
  address: string;
  role: string;
  createdAt: string;
}

const inputClass =
  'w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    address: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/account');
      return;
    }

    const user = JSON.parse(stored);
    fetchProfile(user.email);
  }, [router]);

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(
        `/api/auth/profile?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          dob: data.dob ? data.dob.split('T')[0] : '',
          address: data.address || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: formData.name,
          phone: formData.phone,
          dob: formData.dob || null,
          address: formData.address,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);

        // Update localStorage so navbar shows new name
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...stored, name: updated.name, phone: updated.phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-auth-change'));

        setMessage('Profile updated successfully');
      } else {
        setMessage('Failed to update profile');
      }
    } catch (err) {
      setMessage('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <Link href="/account">
          <Button variant="outline" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Account
          </Button>
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Profile Information
            </h1>
            <p className="text-sm text-muted-foreground">
              Update your personal details
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className={inputClass + ' opacity-60 cursor-not-allowed'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Enter your full address"
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="gap-2" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/account">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        {/* Account info footer */}
        <div className="mt-6 text-xs text-muted-foreground">
          <p>
            Member since{' '}
            {new Date(profile.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
