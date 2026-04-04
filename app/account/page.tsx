'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OrderCard, { type AccountOrder } from '@/components/order-card';
import CancelOrderModal from '@/components/cancel-order-modal';
import LogoutConfirmModal from '@/components/logout-confirm-modal';
import { formatINRCurrency } from '@/lib/currency';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  ShoppingBag,
  Truck,
  Clock3,
  XCircle,
  ShieldCheck,
  Eye,
  Ban,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';

type AccountTab = 'dashboard' | 'orders' | 'address' | 'wishlist';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
  profileImage?: string;
  role: string;
  createdAt: string;
}

interface AddressItem {
  _id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

type ToastState = {
  type: 'success' | 'error';
  message: string;
};

const cardClass = 'bg-white rounded-xl shadow-sm p-5';
const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all';

function normalizeStatus(orderStatus?: string) {
  const s = String(orderStatus || '').toLowerCase();
  if (s.includes('delivered')) return 'Delivered';
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('pending') || s.includes('process') || s.includes('ship') || s.includes('packed')) return 'Pending';
  return 'Ordered';
}

function getStatusBadgeClass(status: string) {
  if (status === 'Delivered') return 'bg-green-100 text-green-700';
  if (status === 'Cancelled') return 'bg-red-100 text-red-700';
  if (status === 'Pending') return 'bg-yellow-100 text-yellow-700';
  return 'bg-yellow-100 text-yellow-700';
}

function getInitial(name?: string, email?: string) {
  const base = (name || email || 'U').trim();
  return base.charAt(0).toUpperCase();
}

function displayAddressLine(address: AddressItem) {
  return `${address.address}, ${address.city}, ${address.state} - ${address.pincode}`;
}

export default function AccountPage() {
  const router = useRouter();
  const {
    user: authUser,
    isAuthenticated,
    loading: authLoading,
    logout,
    refreshUser,
  } = useAuth();

  const [authChecking, setAuthChecking] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [user, setUser] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [activeTab, setActiveTab] = useState<AccountTab>('dashboard');
  const [cancellingId, setCancellingId] = useState('');
  const [cancelModalOrderId, setCancelModalOrderId] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState('');
  const [defaultingAddressId, setDefaultingAddressId] = useState('');
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/address/user`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
      }
    } catch {
      // Ignore address refresh failure to keep dashboard usable.
    }
  }, []);

  const loadDashboard = useCallback(async (email: string) => {
    setLoadingDashboard(true);
    setError('');

    try {
      const [profileRes, ordersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile?email=${encodeURIComponent(email)}`, { cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/user?email=${encodeURIComponent(email)}`, { cache: 'no-store' }),
      ]);

      const profileData = await profileRes.json();

      if (!profileRes.ok) {
        throw new Error(profileData.error || profileData.message || 'Unable to load profile');
      }

      if (profileData.message === 'User blocked') {
        throw new Error(profileData.error || 'Your account has been blocked.');
      }

      setUser(profileData);
      setProfileForm({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
      });

      if (ordersRes.ok) {
        const orderData = await ordersRes.json();
        setOrders(Array.isArray(orderData) ? orderData : []);
      } else {
        setOrders([]);
      }

      await loadAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to load account dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  }, [loadAddresses]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser?.email) {
      router.replace('/login?redirect=/account');
      setAuthChecking(false);
      return;
    }

    setAuthChecking(false);
    loadDashboard(authUser.email);
  }, [loadDashboard, router, authLoading, isAuthenticated, authUser?.email]);

  const orderStats = useMemo(() => {
    const stats = {
      total: orders.length,
      delivered: 0,
      pending: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const normalized = normalizeStatus(order.orderStatus);
      if (normalized === 'Delivered') stats.delivered += 1;
      else if (normalized === 'Cancelled') stats.cancelled += 1;
      else if (normalized === 'Pending') stats.pending += 1;
    });

    return stats;
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const orderedByDate = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders]
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace('/login');
    setLoggingOut(false);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await handleLogout();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update profile');
      }

      const updatedUser = {
        ...data,
        email: profileForm.email.trim() || data.email,
      };

      setUser(updatedUser);
      await refreshUser();
      setProfileModalOpen(false);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const persistAddresses = async (nextAddresses: AddressItem[]) => {
    setAddresses(nextAddresses);
  };

  const openNewAddressForm = () => {
    setEditingAddressId('');
    setAddressForm({
      fullName: user?.name || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: addresses.length === 0,
    });
    setAddressFormOpen(true);
  };

  const openEditAddressForm = (address: AddressItem) => {
    setEditingAddressId(address._id);
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
    setAddressFormOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (
      !addressForm.fullName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.address.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      setError('All address fields are required');
      return;
    }

    if (!/^\d{10}$/.test(addressForm.phone.trim())) {
      setError('Phone number must be 10 digits');
      return;
    }

    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      setError('Pincode must be 6 digits');
      return;
    }

    setSavingAddress(true);

    try {
      const endpoint = editingAddressId ? `/api/address/${editingAddressId}` : '/api/address';
      const method = editingAddressId ? 'PUT' : 'POST';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save address');
      }

      await loadAddresses();
      setAddressFormOpen(false);
      setEditingAddressId('');
      setSuccess(editingAddressId ? 'Address updated successfully' : 'Address added successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const confirmed = window.confirm('Delete this address?');
    if (!confirmed) return;

    setDeletingAddressId(addressId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/address/${addressId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete address');
      }

      const nextAddresses = addresses.filter((item) => item._id !== addressId);
      await persistAddresses(nextAddresses);
      await loadAddresses();
      setSuccess('Address deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete address');
    } finally {
      setDeletingAddressId('');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const selected = addresses.find((item) => item._id === addressId);
    if (!selected) return;

    setDefaultingAddressId(addressId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/address/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to set default address');
      }

      await loadAddresses();
      setSuccess('Default address updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to set default address');
    } finally {
      setDefaultingAddressId('');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setCancelModalOrderId(orderId);
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrderId) return;

    setCancellingId(cancelModalOrderId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/cancel/${cancelModalOrderId}`, {
        method: 'PUT',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order._id === cancelModalOrderId
            ? { ...order, orderStatus: 'Cancelled', trackingStatus: 'Cancelled', status: 'Cancelled' }
            : order
        )
      );
      setSuccess('Order cancelled successfully');
      setToast({ type: 'success', message: 'Order cancelled successfully' });
    } catch (err: any) {
      const message = err.message || 'Failed to cancel order';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setCancellingId('');
      setCancelModalOrderId('');
    }
  };

  const sidebarItems: Array<{ key: AccountTab | 'logout'; label: string; icon: any }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'orders', label: 'My Orders', icon: Package },
    { key: 'address', label: 'Saved Addresses', icon: MapPin },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    { key: 'logout', label: 'Logout', icon: LogOut },
  ];

  if (authChecking || loadingDashboard || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your account...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                <img
                  src={user?.avatar || user?.profileImage || '/default-avatar.svg'}
                  alt="profile"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.key !== 'logout' && activeTab === item.key;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.key === 'logout') {
                          handleLogoutConfirm();
                          return;
                        }
                        setActiveTab(item.key);
                      }}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : item.key === 'logout'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="space-y-6">
            <header className="rounded-2xl border border-blue-100 bg-white shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
              </div>
              <Button variant="outline" onClick={() => setProfileModalOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            </header>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
            )}

            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className={`${cardClass} border border-gray-100`}>
                    <p className="text-xs text-gray-500">Total Orders</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{orderStats.total}</p>
                  </div>
                  <div className={`${cardClass} border border-green-100 bg-green-50`}>
                    <p className="text-xs text-green-700">Delivered</p>
                    <p className="mt-1 text-3xl font-bold text-green-700">{orderStats.delivered}</p>
                  </div>
                  <div className={`${cardClass} border border-yellow-100 bg-yellow-50`}>
                    <p className="text-xs text-yellow-700">Pending</p>
                    <p className="mt-1 text-3xl font-bold text-yellow-700">{orderStats.pending}</p>
                  </div>
                  <div className={`${cardClass} border border-red-100 bg-red-50`}>
                    <p className="text-xs text-red-700">Cancelled</p>
                    <p className="mt-1 text-3xl font-bold text-red-700">{orderStats.cancelled}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={cardClass}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-gray-900">Profile Details</h2>
                      <Link href="/account/profile">
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Name</span>
                        <span className="font-medium text-gray-900 text-right">{user.name}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium text-gray-900 text-right">{user.email}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium text-gray-900 text-right">{user.phone || 'Not set'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-gray-900">Default Address</h2>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('address')}>
                        Manage
                      </Button>
                    </div>
                    {addresses.find((a) => a.isDefault) ? (
                      <>
                        <p className="font-semibold text-gray-900">{addresses.find((a) => a.isDefault)?.fullName}</p>
                        <p className="text-sm text-gray-600 mt-1">{addresses.find((a) => a.isDefault)?.phone}</p>
                        <p className="text-sm text-gray-700 mt-2">
                          {displayAddressLine(addresses.find((a) => a.isDefault) as AddressItem)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No default address selected yet.</p>
                    )}
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>
                      View All Orders
                    </Button>
                  </div>

                  {recentOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => {
                        const normalizedStatus = normalizeStatus(order.status || order.trackingStatus || order.orderStatus);
                        const firstProduct = order.products?.[0]?.productName || 'Product';
                        const moreCount = Math.max(0, (order.products?.length || 0) - 1);

                        return (
                          <div key={order._id} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">{order.orderNumber || order._id}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                                  normalizedStatus
                                )}`}
                              >
                                {normalizedStatus}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                              <p className="text-gray-700">
                                {firstProduct}
                                {moreCount > 0 ? ` +${moreCount} more` : ''}
                              </p>
                              <p className="font-semibold text-gray-900">{formatINRCurrency(order.totalAmount)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className={cardClass}>
                  <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
                  <p className="text-sm text-gray-500 mt-1">Complete order history with live tracking timeline</p>
                </div>

                {orderedByDate.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                    <h2 className="text-lg font-semibold text-gray-900">You have no orders yet</h2>
                    <p className="mt-1 text-sm text-gray-500">Once you place an order, it will appear here.</p>
                    <Button className="mt-5" onClick={() => router.push('/products')}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderedByDate.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        isCancelling={cancellingId === order._id}
                        onCancel={handleCancelOrder}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'address' && (
              <div className="space-y-4">
                <div className={`${cardClass} flex items-center justify-between gap-3`}>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage delivery locations and default address</p>
                  </div>
                  <Button onClick={openNewAddressForm} disabled={savingAddress} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add New Address
                  </Button>
                </div>

                {addressFormOpen && (
                  <form onSubmit={handleSaveAddress} className={`${cardClass} space-y-3 border border-gray-200`}>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Full Name</label>
                        <input
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Phone</label>
                        <input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600">Address</label>
                      <input
                        value={addressForm.address}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">City</label>
                        <input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">State</label>
                        <input
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Pincode</label>
                        <input
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      />
                      Set as default address
                    </label>

                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={savingAddress} className="bg-blue-600 hover:bg-blue-700">
                        {savingAddress ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Address
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAddressFormOpen(false);
                          setEditingAddressId('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                    No address saved yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address._id} className={`${cardClass} border border-gray-100`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              {address.fullName}
                              {address.isDefault && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                  Default
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
                            <p className="text-sm text-gray-700 mt-2">{displayAddressLine(address)}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditAddressForm(address)}>
                            <Pencil className="h-4 w-4 mr-1.5" /> Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAddress(address._id)}
                            disabled={deletingAddressId === address._id}
                          >
                            {deletingAddressId === address._id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                              </>
                            )}
                          </Button>
                          {!address.isDefault && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleSetDefaultAddress(address._id)}
                              disabled={defaultingAddressId === address._id}
                            >
                              {defaultingAddressId === address._id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Updating...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1.5" /> Set Default
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                <div className={cardClass}>
                  <h2 className="text-xl font-semibold text-gray-900">Wishlist</h2>
                  <p className="text-sm text-gray-500 mt-1">See saved products and continue shopping quickly</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className={`${cardClass} border border-gray-100`}>
                    <Heart className="w-5 h-5 text-blue-600" />
                    <p className="mt-2 text-sm text-gray-500">Saved Favorites</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">View</p>
                  </div>
                  <div className={`${cardClass} border border-gray-100`}>
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <p className="mt-2 text-sm text-gray-500">Fast Checkout</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">Enabled</p>
                  </div>
                  <div className={`${cardClass} border border-gray-100`}>
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    <p className="mt-2 text-sm text-gray-500">Recommended</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">Products</p>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/wishlist">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Eye className="h-4 w-4 mr-1.5" /> Open Wishlist
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button variant="outline">Browse Products</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close profile modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Email</label>
                <input value={profileForm.email} className={`${inputClass} bg-gray-50`} disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="Phone number"
                />
              </div>
              <div className="pt-2 flex items-center gap-2">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setProfileModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loggingOut && (
        <div className="fixed bottom-5 right-5 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">
          Logging out...
        </div>
      )}

      <CancelOrderModal
        open={Boolean(cancelModalOrderId)}
        isProcessing={Boolean(cancelModalOrderId) && cancellingId === cancelModalOrderId}
        onOpenChange={(open) => {
          if (!open && !cancellingId) setCancelModalOrderId('');
        }}
        onConfirm={handleConfirmCancelOrder}
      />

      <LogoutConfirmModal
        open={showLogoutModal}
        isProcessing={loggingOut}
        onOpenChange={(open) => {
          if (!open && !loggingOut) setShowLogoutModal(false);
        }}
        onConfirm={handleConfirmLogout}
      />

      {toast && (
        <div
          className={`fixed bottom-16 right-5 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
