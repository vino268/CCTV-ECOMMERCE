'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Save,
  Loader2,
  Lock,
  KeyRound,
  ImagePlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';
import { toProfileImageUrl } from '@/lib/profile-image-url';
import { useAdminAuth } from '@/lib/contexts/admin-auth-context';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profileImage?: string | null;
  avatar?: string | null;
  avatarVersion?: number;
  createdAt: string;
}

function getInitial(name?: string, email?: string) {
  return (name || email || 'A').charAt(0).toUpperCase();
}


export default function AdminProfilePage() {
  const { setAdmin: setGlobalAdmin } = useAdminAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [removeAvatarOnSave, setRemoveAvatarOnSave] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileErrors, setProfileErrors] = useState<{ email?: string; phone?: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile", {
        method: "GET",
        credentials: "include"
      });

      const data = await res.json();
      console.log("Profile API response:", data);

      if (data.success) {
        setProfile(data.data);
        setGlobalAdmin(data.data);
      } else {
        window.location.href = "/admin/login";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || '');
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
    setAvatarPreview(profile.profileImage || '');
  }, [profile]);

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return 'N/A';
    return new Date(profile.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [profile?.createdAt]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Unable to load admin profile.</p>
      </div>
    );
  }

  const admin = profile; // Alias for backward compatibility in the rest of the file

  const validateProfile = () => {
    const nextErrors: { email?: string; phone?: string } = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (phone.trim() && !/^\d+$/.test(phone.trim())) {
      nextErrors.phone = 'Phone number must contain only numbers';
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePassword = () => {
    const nextErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) {
      nextErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword || newPassword.length < 6) {
      nextErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Confirm password must match new password';
    }

    setPasswordErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setProfileMessage({ type: 'error', text: 'Only JPG and PNG images are allowed' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image size must be 10MB or less' });
      return;
    }

    setProfileMessage(null);
    setSelectedAvatarFile(file);
    setRemoveAvatarOnSave(false);

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/profile/avatar', { method: 'DELETE' });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove profile image');
      }

      setSelectedAvatarFile(null);
      setAvatarPreview('');
      setRemoveAvatarOnSave(false);
      
      setGlobalAdmin({
        ...admin,
        profileImage: '',
        avatar: '',
        avatarVersion: Date.now(),
      });

      setProfileMessage({ type: 'success', text: 'Image removed successfully' });
    } catch (err: any) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.message || 'Failed to remove profile image' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!validateProfile()) return;

    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);

      if (selectedAvatarFile) {
        let fileToUpload = selectedAvatarFile;

        // Compress image
        try {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 500,
            useWebWorker: true,
            initialQuality: 0.7,
          };
          console.log(`Compressing profile image...`);
          fileToUpload = await imageCompression(selectedAvatarFile, options);
          console.log(`Compressed from ${selectedAvatarFile.size} to ${fileToUpload.size}`);
        } catch (err) {
          console.error('Compression failed', err);
        }

        if (fileToUpload.size > 10 * 1024 * 1024) {
          throw new Error('Image size must be 10MB or less after compression');
        }

        formData.append('image', fileToUpload);
      }

      const res = await fetchWithAuth('/api/admin/profile', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedAdmin = data.admin;
      const nextProfileImage = updatedAdmin.profileImage || updatedAdmin.avatar || '';

      const mergedAdmin = {
        ...admin,
        ...updatedAdmin,
        profileImage: String(nextProfileImage || ''),
        avatar: String(nextProfileImage || ''),
        avatarVersion: selectedAvatarFile || removeAvatarOnSave ? Date.now() : admin?.avatarVersion,
      };
      setGlobalAdmin(mergedAdmin);
      setProfile(mergedAdmin); // Also update local profile state
      setSelectedAvatarFile(null);
      setRemoveAvatarOnSave(false);
      setAvatarPreview('');

      if (selectedAvatarFile) {
        setProfileMessage({ type: 'success', text: 'Profile and image updated successfully' });
      } else {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!validatePassword()) return;

    setSavingPassword(true);
    try {
      const res = await fetchWithAuth('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setSavingPassword(false);
    }
  };


  const displayAvatar = removeAvatarOnSave ? '' : avatarPreview || admin?.profileImage || '';
  const displayAvatarSrc = toProfileImageUrl(displayAvatar, admin?.avatarVersion);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>

      <section className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Overview</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {displayAvatar ? (
                <img src={displayAvatarSrc} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                getInitial(admin?.name, admin?.email)
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition">
              <ImagePlus className="w-3.5 h-3.5" />
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900">{admin?.name || 'Admin'}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              {admin?.role || 'Admin'}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <Calendar className="w-4 h-4" />
              Joined {joinedDate}
            </p>
            {(displayAvatar || removeAvatarOnSave) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-2"
                onClick={handleRemoveAvatar}
                disabled={savingProfile}
              >
                <Trash2 className="w-4 h-4" />
                Remove Image
              </Button>
            )}
            {(selectedAvatarFile || removeAvatarOnSave) && (
              <p className="mt-2 text-xs text-blue-600">Avatar changes will apply after clicking Save Changes.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Editable Information</h2>

        {profileMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              profileMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1.5">
              <User className="w-4 h-4 text-gray-500" /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin Name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1.5">
              <Mail className="w-4 h-4 text-gray-500" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setProfileErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="admin@example.com"
              className={inputClass}
              required
            />
            {profileErrors.email && <p className="text-xs text-red-600 mt-1">{profileErrors.email}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1.5">
              <Phone className="w-4 h-4 text-gray-500" /> Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setProfileErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder="9876543210"
              className={inputClass}
            />
            {profileErrors.phone && <p className="text-xs text-red-600 mt-1">{profileErrors.phone}</p>}
          </div>

          <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={savingProfile}>
            {savingProfile ? (
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
      </section>

      <section className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>

        {passwordMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1.5">
              <KeyRound className="w-4 h-4 text-gray-500" /> Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
              }}
              className={inputClass}
              required
            />
            {passwordErrors.currentPassword && (
              <p className="text-xs text-red-600 mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1.5">
              <Lock className="w-4 h-4 text-gray-500" /> New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
              }}
              className={inputClass}
              required
            />
            {passwordErrors.newPassword && <p className="text-xs text-red-600 mt-1">{passwordErrors.newPassword}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1.5">
              <Lock className="w-4 h-4 text-gray-500" /> Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              className={inputClass}
              required
            />
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={savingPassword}>
            {savingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Updating...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" /> Update Password
              </>
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
