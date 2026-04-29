'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { parseResponseBody } from '@/lib/http-response';

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

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all';

export default function MyAddressPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [settingDefaultId, setSettingDefaultId] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadAddresses = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/address/my', {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await parseResponseBody<{ success?: boolean; message?: string; addresses?: AddressItem[] }>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load addresses');
      }

      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/account/address');
      return;
    }

    loadAddresses();
  }, [router, authLoading, isAuthenticated]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const validateForm = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      return 'All fields are required';
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      return 'Phone number must be 10 digits';
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      return 'Pincode must be 6 digits';
    }
    return '';
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setForm({ fullName: '', phone: '', address: '', city: '', state: '', pincode: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (address: AddressItem) => {
    setEditingAddress(address);
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const endpoint = editingAddress ? `/api/address/${editingAddress._id}` : '/api/address/add';
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await parseResponseBody<{ success?: boolean; message?: string }>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save address');
      }

      await loadAddresses();
      setShowModal(false);
      setToast(editingAddress ? 'Address updated' : 'Address added');
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;

    setDeletingId(id);
    setError('');

    try {
      const res = await fetch(`/api/address/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await parseResponseBody<{ success?: boolean; message?: string }>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete address');
      }

      setAddresses((prev) => prev.filter((item) => item._id !== id));
      setToast('Address deleted');
    } catch (err: any) {
      setError(err.message || 'Failed to delete address');
    } finally {
      setDeletingId('');
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    setError('');

    try {
      const res = await fetch(`/api/address/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await parseResponseBody<{ success?: boolean; message?: string }>(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to set default');
      }

      setAddresses((prev) =>
        prev.map((item) => ({ ...item, isDefault: item._id === id }))
      );
      setToast('Default address updated');
    } catch (err: any) {
      setError(err.message || 'Failed to set default');
    } finally {
      setSettingDefaultId('');
    }
  };

  const orderedAddresses = useMemo(
    () => [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [addresses]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/account')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
          </div>

          <Button onClick={openAddModal} className="bg-slate-900 hover:bg-black">
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Address
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 mb-4 animate-pulse h-28" />
            ))}
          </div>
        ) : orderedAddresses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            No addresses added yet.
          </div>
        ) : (
          <div>
            {orderedAddresses.map((item) => (
              <div key={item._id} className="bg-white rounded-xl shadow-sm p-5 mb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {item.fullName}
                      {item.isDefault && (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{item.phone}</p>
                    <p className="text-sm text-gray-700 mt-1">{item.address}</p>
                    <p className="text-sm text-gray-700">{item.city}, {item.state}</p>
                    <p className="text-sm text-gray-700">Pincode: {item.pincode}</p>
                  </div>

                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                    <Pencil className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                  >
                    {deletingId === item._id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </>
                    )}
                  </Button>
                  {!item.isDefault && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleSetDefault(item._id)}
                      disabled={settingDefaultId === item._id}
                    >
                      {settingDefaultId === item._id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1.5" />
                          Set as Default
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

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                type="button"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <input
                className={inputClass}
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                required
              />
              <input
                className={inputClass}
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <input
                className={inputClass}
                placeholder="Address Line"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  required
                />
                <input
                  className={inputClass}
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <input
                className={inputClass}
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))}
                required
              />

              <div className="pt-2 flex items-center gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingAddress ? 'Update Address' : 'Add Address'}</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 rounded-lg bg-green-600 text-white px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
