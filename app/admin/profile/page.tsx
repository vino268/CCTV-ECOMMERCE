'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Calendar, Save, Loader2 } from 'lucide-react';

const inputClass =
  'w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors';

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = localStorage.getItem('admin');
        if (!stored) return;
        const adminData = JSON.parse(stored);

        const res = await fetch(`/api/admin/profile?email=${encodeURIComponent(adminData.email)}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (data.success) {
          setAdmin(data.admin);
          setName(data.admin.name || '');
          setEmail(data.admin.email || '');
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
    if (!admin) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: admin._id, name, email }),
      });

      const data = await res.json();

      if (data.success) {
        setAdmin(data.admin);
        // Update localStorage
        const stored = localStorage.getItem('admin');
        if (stored) {
          const adminData = JSON.parse(stored);
          adminData.name = data.admin.name;
          adminData.email = data.admin.email;
          localStorage.setItem('admin', JSON.stringify(adminData));
        }
        setMessage({ type: 'success', text: 'Profile updated successfully' });
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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Admin Profile</h1>

      {/* Profile Info Card */}
      {admin && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {(admin.name || admin.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{admin.name || 'Admin'}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                {admin.role || 'admin'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Edit Profile</h3>

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
            <label className="block text-sm font-medium text-foreground mb-1.5">
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
            <label className="block text-sm font-medium text-foreground mb-1.5">
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
