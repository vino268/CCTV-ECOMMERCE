'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  LogOut,
  User,
  Package,
  MapPin,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';

interface OrderProduct {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface UserData {
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

export default function AccountPage() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    phone: '',
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Check login on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setIsLoggedIn(true);
      fetchOrders(parsed.email);
    }
    setLoading(false);
  }, []);

  const fetchOrders = async (email: string) => {
    try {
      const res = await fetch(`/api/orders`, { cache: 'no-store' });
      if (res.ok) {
        const all: Order[] = await res.json();
        const userOrders = all.filter(
          (o) => o.email.toLowerCase() === email.toLowerCase()
        );
        setOrders(userOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleRedirectAfterLogin = () => {
    const redirect = localStorage.getItem('redirectAfterLogin');
    if (redirect) {
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirect);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Login                                                           */
  /* ---------------------------------------------------------------- */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data));
      window.dispatchEvent(new Event('user-auth-change'));
      setUser(data);
      setIsLoggedIn(true);
      fetchOrders(data.email);
      setLoginForm({ email: '', password: '' });
      handleRedirectAfterLogin();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Signup                                                          */
  /* ---------------------------------------------------------------- */

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSignupLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password,
          dob: signupForm.dob || null,
          phone: signupForm.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data));
      window.dispatchEvent(new Event('user-auth-change'));
      setUser(data);
      setIsLoggedIn(true);
      setSignupForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dob: '',
        phone: '',
      });
      handleRedirectAfterLogin();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Logout                                                          */
  /* ---------------------------------------------------------------- */

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-auth-change'));
    setIsLoggedIn(false);
    setUser(null);
    setOrders([]);
  };

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                   */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  /* ================================================================ */
  /*  NOT LOGGED IN — Login / Signup Forms                            */
  /* ================================================================ */

  if (!isLoggedIn) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-1">
              Login or create an account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <Tabs defaultValue="login" onValueChange={() => setError('')}>
              <TabsList className="grid grid-cols-2 w-full rounded-none">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* ====== LOGIN ====== */}
              <TabsContent value="login" className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                        className={inputClass + ' pr-10'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showLoginPassword ? (
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
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* ====== SIGNUP ====== */}
              <TabsContent value="signup" className="p-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={signupForm.name}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, name: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, email: e.target.value })
                      }
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          placeholder="Min 6 chars"
                          value={signupForm.password}
                          onChange={(e) =>
                            setSignupForm({
                              ...signupForm,
                              password: e.target.value,
                            })
                          }
                          className={inputClass + ' pr-10'}
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowSignupPassword(!showSignupPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSignupPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter"
                        value={signupForm.confirmPassword}
                        onChange={(e) =>
                          setSignupForm({
                            ...signupForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={signupForm.dob}
                        onChange={(e) =>
                          setSignupForm({
                            ...signupForm,
                            dob: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={signupForm.phone}
                        onChange={(e) =>
                          setSignupForm({
                            ...signupForm,
                            phone: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={signupLoading}
                  >
                    {signupLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  LOGGED IN — Dashboard                                          */
  /* ================================================================ */

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and view your orders
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Quick Links Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Link
            href="/account/profile"
            className="group border border-border rounded-xl p-6 bg-card hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Profile Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View and edit your details
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <Link
            href="/account/orders"
            className="group border border-border rounded-xl p-6 bg-card hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">My Orders</h3>
                  <p className="text-sm text-muted-foreground">
                    {orders.length} order{orders.length !== 1 ? 's' : ''} placed
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <Link
            href="/account/profile"
            className="group border border-border rounded-xl p-6 bg-card hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">My Address</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage delivery address
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>

        {/* Account Info Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="border border-border rounded-xl p-6 bg-card">
            <h3 className="font-semibold text-foreground mb-4">
              Account Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">
                  {user?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">
                  {user?.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">
                  {user?.phone || 'Not set'}
                </span>
              </div>
            </div>
            <Link href="/account/profile">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="border border-border rounded-xl p-6 bg-card">
            <h3 className="font-semibold text-foreground mb-4">
              Order Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {orders.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Orders
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {orders.filter((o) => o.orderStatus === 'Delivered').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Delivered</p>
              </div>
            </div>
            <Link href="/account/orders">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Recent Orders
              </h2>
              <Link
                href="/account/orders"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="border border-border rounded-xl p-5 bg-card"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.orderStatus === 'Delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.orderStatus === 'Shipped'
                              ? 'bg-purple-100 text-purple-800'
                              : order.orderStatus === 'Processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                      <span className="font-bold text-primary">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                    {order.products.map((p, i) => (
                      <span key={i}>
                        {p.productName} x{p.quantity}
                        {i < order.products.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
