'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Save, Camera, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import DeleteAccountModal from '@/components/delete-account-modal';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';
import { toProfileImageUrl } from '@/lib/profile-image-url';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  profileImage?: string | null;
  dob: string | null;
  address: string;
  role: string;
  createdAt: string;
}

const inputClass =
  'w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors';

function getInitial(name?: string, email?: string) {
  return (name || email || 'U').charAt(0).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, refreshUser, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarCacheKey, setAvatarCacheKey] = useState<number | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
        `/api/user/profile?email=${encodeURIComponent(email)}`,
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );
      const data: any = await parseResponseBody(res);

      if (!res.ok) {
        setMessage(data?.message || 'Failed to load profile');
        setMessageType('error');
        setLoading(false);
        return;
      }

      const userData: UserProfile = data as UserProfile;
      setProfile(userData);
      setAvatarPreview(userData.profileImage || userData.avatar || '');
      setAvatarCacheKey(undefined);
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        dob: userData.dob ? userData.dob.split('T')[0] : '',
        address: userData.address || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setMessage('Failed to load profile');
      setMessageType('error');
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
      const uploadData = new FormData();
      uploadData.append('name', formData.name);
      uploadData.append('phone', formData.phone);
      uploadData.append('dob', formData.dob || '');
      uploadData.append('address', formData.address);

      if (avatarFile) {
        uploadData.append('image', avatarFile);
      }

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        body: uploadData,
      });

      if (res.ok) {
        const updated = await parseResponseBody<any>(res);
        const nextAvatarUrl = updated.profileImage || updated.avatar || '';
        
        setProfile(updated);
        setAvatarPreview(nextAvatarUrl);
        setAvatarFile(null);
        setAvatarCacheKey(Date.now());
        
        updateUser({
          name: updated.name || formData.name,
          avatar: nextAvatarUrl,
          profileImage: nextAvatarUrl,
        });
        await refreshUser();

        if (avatarFile) {
          setMessage('Profile and image updated successfully');
          setMessageType('success');
        } else {
          setMessage('Profile updated successfully');
          setMessageType('success');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage(errorData.message || 'Failed to update profile');
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

  const handleRemoveAvatar = async () => {
    if (!profile) return;

    setRemovingAvatar(true);
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch('/api/profile/image', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await parseResponseBody<any>(res);
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to remove profile image');
      }

      const nextProfile = { ...profile, avatar: null, profileImage: null };
      setProfile(nextProfile);
      setAvatarPreview('');
      setAvatarCacheKey(undefined);
      setAvatarFile(null);
      updateUser({ avatar: '', profileImage: '' });
      await refreshUser();

      setMessage('Profile image removed');
      setMessageType('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove profile image';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setRemovingAvatar(false);
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
    setAvatarCacheKey(undefined);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Password is required');
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await parseResponseBody<any>(res);

      if (!res.ok) {
        setDeleteError(data?.error || 'Unable to delete account');
        return;
      }

      await logout();
      router.replace('/login?accountDeleted=1');
    } catch (error) {
      setDeleteError('Unable to delete account right now. Please try again.');
    } finally {
      setDeletingAccount(false);
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

  const avatarSrc = toProfileImageUrl(avatarPreview, avatarCacheKey);

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
            <label className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center overflow-hidden cursor-pointer">
              {avatarPreview ? (
                <img src={avatarSrc} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">
                  {getInitial(formData.name || profile.name, profile.email)}
                </span>
              )}
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
            </label>
            <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:bg-black transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Profile Information
            </h1>
            <p className="text-sm text-muted-foreground">
              Update your personal details
            </p>
            {(avatarPreview || profile.profileImage || profile.avatar) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={handleRemoveAvatar}
                disabled={removingAvatar || saving || uploadingAvatar}
              >
                {removingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {removingAvatar ? 'Removing...' : 'Remove Image'}
              </Button>
            )}
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

        <div className="mt-8 rounded-xl border border-red-200 bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
          <p className="mt-1 text-sm text-gray-600">
            Permanently remove your account and all related data.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-4 rounded-xl bg-red-500 hover:bg-red-600"
            onClick={() => {
              setDeleteError('');
              setDeletePassword('');
              setShowDeleteModal(true);
            }}
          >
            Delete Account
          </Button>
        </div>
      </div>

      <DeleteAccountModal
        open={showDeleteModal}
        password={deletePassword}
        isProcessing={deletingAccount}
        errorMessage={deleteError}
        onPasswordChange={(value) => {
          setDeletePassword(value);
          if (deleteError) setDeleteError('');
        }}
        onOpenChange={(open) => {
          if (!open && deletingAccount) return;
          setShowDeleteModal(open);
          if (!open) {
            setDeletePassword('');
            setDeleteError('');
          }
        }}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
