'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { fetchWithAuth } from '@/utils/api';

const inputClass =
  'w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors';
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');

async function parseApiResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return res.json().catch(() => ({}));
  }

  const text = await res.text().catch(() => '');
  const htmlLike = /^\s*<!doctype|^\s*<html/i.test(text);

  return {
    message: htmlLike
      ? 'Received HTML instead of JSON from admin API. Check backend URL and server status.'
      : text || 'Unexpected server response',
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Unauthorized Access');
    }

    const checkSession = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/api/admin/profile`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (res.ok) {
          router.replace('/admin/dashboard');
        }
      } catch {
        // Ignore and stay on login page.
      }
    };

    checkSession();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError(data.error || data.message || 'Login failed');
        return;
      }

      if (res.ok && data?.success) {
        router.push('/admin/dashboard');
        return;
      }

      router.push('/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">
            TN Automation — Authorized Access Only
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className={inputClass}
                inputMode="email"
                required
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use your authorized admin email.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className={inputClass + ' pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In to Admin'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This area is restricted to authorized administrators.
        </p>
      </div>
    </div>
  );
}
