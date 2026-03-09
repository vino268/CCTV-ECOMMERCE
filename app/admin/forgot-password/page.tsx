'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, KeyRound, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const inputClass =
  'w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors';

type Step = 'email' | 'token' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [devToken, setDevToken] = useState('');

  // Step 1: Request reset token
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        // In development, pre-fill the token
        if (data.resetToken) {
          setDevToken(data.resetToken);
        }
        setStep('token');
      } else {
        setMessage({ type: 'error', text: data.message || 'Request failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Password reset successfully!' });
        setStep('done');
      } else {
        setMessage({ type: 'error', text: data.message || 'Reset failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Forgot Password</h1>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Reset Admin Password</h3>
            <p className="text-xs text-muted-foreground">
              {step === 'email' && 'Enter your admin email to receive a reset token'}
              {step === 'token' && 'Enter the reset token and your new password'}
              {step === 'done' && 'Your password has been reset'}
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

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Admin Email
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className={inputClass}
                required
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...
                </>
              ) : (
                'Send Reset Token'
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Token + New Password */}
        {step === 'token' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {devToken && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-700 mb-1">Dev Mode — Reset Token:</p>
                <code className="text-xs text-blue-600 break-all">{devToken}</code>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Reset Token
                </span>
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className={inputClass + ' pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={inputClass}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setMessage({ type: '', text: '' });
              }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to email step
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-4">Password reset successfully!</p>
            <Link href="/admin/login">
              <Button size="lg">Go to Admin Login</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
