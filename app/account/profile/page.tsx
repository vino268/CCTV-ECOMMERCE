'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Save, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  dob: string | null;
  address: string;
  role: string;
  createdAt: string;
}

const inputClass =
  'w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    address: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user?.email) {
      router.push('/login?redirect=/account/profile');
      return;
    }
    fetchProfile(user.email);
  }, [router, authLoading, isAuthenticated, user?.email]);

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setAvatarPreview(data.avatar || '');
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
    setMessageType('');

    try {
      let avatarUrl = profile.avatar || '';

      if (avatarFile) {
        setUploadingAvatar(true);

        const uploadData = new FormData();
        uploadData.append('file', avatarFile);
        uploadData.append('email', profile.email);

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/upload-avatar`, {
          method: 'POST',
          body: uploadData,
        });

        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.message || 'Failed to upload profile image');
        }

        avatarUrl = uploadJson.avatarUrl;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: formData.name,
          phone: formData.phone,
          dob: formData.dob || null,
          address: formData.address,
          avatar: avatarUrl,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setAvatarPreview(updated.avatar || avatarUrl || '');
        setAvatarFile(null);
        await refreshUser();

        if (avatarFile) {
          setMessage('Profile image updated');
          setMessageType('success');
        } else {
          setMessage('Profile updated successfully');
          setMessageType('success');
        }
      } else {
        setMessage('Failed to update profile');
        setMessageType('error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setUploadingAvatar(false);
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setMessage('Only JPG and PNG images are allowed');
      setMessageType('error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('Image size must be 2MB or less');
      setMessageType('error');
      return;
    }

    setMessage('');
    setMessageType('');
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
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
          <div className="relative">
            <label className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center overflow-hidden cursor-pointer">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold">
                  {(formData.name || profile.name || profile.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:bg-black transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
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
              messageType === 'success'
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
              {saving || uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving || uploadingAvatar ? 'Saving...' : 'Save Changes'}
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
