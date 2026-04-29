'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/contexts/auth-context';

type AuthMode = 'signin' | 'signup';
const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    phone: '',
  });
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getSafeRedirectPath = () => {
    const redirectParam = searchParams.get('redirect');
    if (!redirectParam) return '/';

    // Allow only same-origin absolute paths.
    if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
      return redirectParam;
    }

    return '/';
  };

  useEffect(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'signup') {
      setMode('signup');
    }

    if (searchParams.get('accountDeleted') === '1') {
      setMode('signin');
      setSuccess('Your account has been successfully deleted');
    } else {
      setSuccess('');
    }

    if (authLoading) return;

    if (isAuthenticated) {
      router.replace(getSafeRedirectPath());
    }
  }, [router, searchParams, isAuthenticated, authLoading]);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signinForm.email,
          password: signinForm.password,
        }),
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serverMessage = data.error || data.message || 'Login failed';
        if (String(serverMessage).toLowerCase().includes('admins must login from admin panel')) {
          setError('⚠️ Admin accounts are not allowed here. Please use Admin Login.');
          return;
        }
        throw new Error(serverMessage || 'Login failed');
      }

      if (!data?.success) {
        throw new Error('Login failed');
      }

      await refreshUser();
      router.push(getSafeRedirectPath());
      router.refresh();
    } catch (error: any) {
      setError(error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const signupRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password,
          dob: signupForm.dob || null,
          phone: signupForm.phone,
        }),
        credentials: 'include',
      });

      const signupData = await signupRes.json().catch(() => ({}));
      if (!signupRes.ok) {
        setError(signupData.error || 'Signup failed');
        return;
      }

      // Login immediately after signup to ensure auth cookie is set.
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
        }),
        credentials: 'include',
      });

      const loginData = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        setError(loginData.error || 'Account created but login failed. Please sign in.');
        setMode('signin');
        return;
      }

      if (!loginData?.success) {
        setError('Account created but login failed. Please sign in.');
        setMode('signin');
        return;
      }

      await refreshUser();
      router.push(getSafeRedirectPath());
      router.refresh();
    } catch {
      setError('Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/login.jpg"
          className="w-full h-full object-cover"
          alt="Security background"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-black/75 backdrop-blur-md px-8 pt-8 pb-6 text-center border-b border-white/10">
            <div className="w-16 h-16 bg-white/10 border-2 border-white/20 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-gray-300 mt-1 text-sm">
              {mode === 'signup'
                ? 'Create your account to manage orders and wishlist'
                : 'Welcome back, sign in to continue'}
            </p>
          </div>

          <div className="px-8 pt-6">
            <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-gray-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-gray-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'signin' ? (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSignIn}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={signinForm.email}
                      onChange={(e) => setSigninForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showSigninPassword ? 'text' : 'password'}
                        value={signinForm.password}
                        onChange={(e) =>
                          setSigninForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                        className={`${inputClass} pr-10`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSigninPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showSigninPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-semibold transition-all shadow-md"
                    size="lg"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      className={inputClass}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                          required
                          className={`${inputClass} pr-10`}
                          placeholder="Min 6 chars"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        value={signupForm.confirmPassword}
                        onChange={(e) =>
                          setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        required
                        className={inputClass}
                        placeholder="Re-enter"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        value={signupForm.dob}
                        onChange={(e) => setSignupForm((prev) => ({ ...prev, dob: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className={inputClass}
                        placeholder="+91 9XXXXXXXXX"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-semibold transition-all shadow-md"
                    size="lg"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100 pb-8">
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setError('');
                }}
                className="text-slate-900 font-bold hover:underline"
              >
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-white/70">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-white">Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
