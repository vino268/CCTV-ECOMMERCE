'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { getAdminAuthHeaders } from '@/lib/admin-auth';
import { buildApiUrl } from '@/lib/http-response';
import toast from 'react-hot-toast';

interface DeletedOrder {
  _id: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  email?: string;
  deletedAt?: string;
}

interface DeletedCustomer {
  _id: string;
  name?: string;
  email?: string;
  deletedAt?: string;
}

interface DeletedProduct {
  _id: string;
  name?: string;
  sku?: string;
  price?: number;
  image?: string;
  deletedAt?: string;
}

type TrashTab = 'deleted-orders' | 'deleted-customers' | 'deleted-products';

type PendingDelete = {
  id: string;
  tab: TrashTab;
  label: string;
} | null;

type BulkDeleteMode = 'selected' | 'all' | null;

function formatDeletedDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminTrashPage() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const paramTab = (searchParams.get('tab') || '').toString();
  const validTabs = ['deleted-orders', 'deleted-customers', 'deleted-products'];
  const defaultTab: TrashTab = 'deleted-products';
  const initialTab = (validTabs.includes(paramTab) ? (paramTab as TrashTab) : defaultTab) as TrashTab;

  const [tab, setTab] = useState<TrashTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DeletedOrder[]>([]);
  const [customers, setCustomers] = useState<DeletedCustomer[]>([]);
  const [products, setProducts] = useState<DeletedProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<BulkDeleteMode>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [error, setError] = useState('');

  const fetchDeletedData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        fetch(buildApiUrl('/api/trash/orders'), {
          cache: 'no-store',
          credentials: 'include',
          headers: getAdminAuthHeaders(),
        }),
        fetch(buildApiUrl('/api/trash/customers'), {
          cache: 'no-store',
          credentials: 'include',
          headers: getAdminAuthHeaders(),
        }),
        fetch(buildApiUrl('/api/trash/products'), {
          cache: 'no-store',
          credentials: 'include',
          headers: getAdminAuthHeaders(),
        }),
      ]);

      const [ordersData, customersData, productsData] = await Promise.all([
        ordersRes.json().catch(() => ([])),
        customersRes.json().catch(() => ([])),
        productsRes.json().catch(() => ([])),
      ]);

      setOrders(ordersRes.ok && Array.isArray(ordersData) ? ordersData : []);
      setCustomers(customersRes.ok && Array.isArray(customersData) ? customersData : []);
      setProducts(productsRes.ok && Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching trash data:', error);
      setOrders([]);
      setCustomers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedData();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [tab]);

  const currentRows = useMemo(() => {
    if (tab === 'deleted-orders') return orders;
    if (tab === 'deleted-customers') return customers;
    return products;
  }, [tab, orders, customers, products]);
  const currentIds = useMemo(() => currentRows.map((row) => row._id), [currentRows]);
  const allSelected = currentRows.length > 0 && selectedIds.length === currentRows.length;
  const anySelected = selectedIds.length > 0;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentIds);
      return;
    }
    setSelectedIds([]);
  };

  const toggleSingleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existingId) => existingId !== id) : [...prev, id]
    );
  };

  const handleRestore = async (id: string, currentTab: TrashTab) => {
    try {
      setError('');
      const key = `${currentTab}-restore-${id}`;
      setActionKey(key);

      let endpoint;
      if (currentTab === 'deleted-orders') {
        endpoint = buildApiUrl(`/api/trash/orders/${id}/restore`);
      } else if (currentTab === 'deleted-customers') {
        endpoint = buildApiUrl(`/api/trash/customers/${id}/restore`);
      } else {
        endpoint = buildApiUrl(`/api/trash/products/${id}/restore`);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const message = data.message || data.error || '';
        setError(message);
        if (message) toast.error(message);
        return;
      }

      // remove restored item from UI instantly
      if (currentTab === 'deleted-orders') setOrders((prev) => prev.filter((o) => o._id !== id));
      if (currentTab === 'deleted-customers') setCustomers((prev) => prev.filter((c) => c._id !== id));
      if (currentTab === 'deleted-products') setProducts((prev) => prev.filter((p) => p._id !== id));

      // keep both trash and orders views in sync without requiring a manual refresh
      await fetchDeletedData();

      // warm dashboard cache and notify listeners
      try {
        fetch(buildApiUrl('/api/admin/dashboard'))
          .catch(() => null);
        window.dispatchEvent(new CustomEvent('admin:counts-changed'));
      } catch (e) {}

      toast.success(data.message || 'Item restored successfully');
    } catch (error) {
      console.error('Restore error:', error);
      setError('');
    } finally {
      setActionKey(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!pendingDelete) return;

    try {
      setError('');
      const key = `${pendingDelete.tab}-permanent-${pendingDelete.id}`;
      setActionKey(key);

      let endpoint;
      if (pendingDelete.tab === 'deleted-orders') {
        endpoint = buildApiUrl(`/api/trash/orders/${pendingDelete.id}`);
      } else if (pendingDelete.tab === 'deleted-customers') {
        endpoint = buildApiUrl(`/api/trash/customers/${pendingDelete.id}`);
      } else {
        endpoint = buildApiUrl(`/api/trash/products/${pendingDelete.id}`);
      }

      const res = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const message = data.message || data.error || '';
        if (message) toast.error(message);
        return;
      }

      // update UI instantly
      if (pendingDelete.tab === 'deleted-orders') setOrders((prev) => prev.filter((o) => o._id !== pendingDelete.id));
      if (pendingDelete.tab === 'deleted-customers') setCustomers((prev) => prev.filter((c) => c._id !== pendingDelete.id));
      if (pendingDelete.tab === 'deleted-products') setProducts((prev) => prev.filter((p) => p._id !== pendingDelete.id));
      setPendingDelete(null);

      await fetchDeletedData();

      try {
        fetch(buildApiUrl('/api/admin/dashboard')).catch(() => null);
        window.dispatchEvent(new CustomEvent('admin:counts-changed'));
        window.dispatchEvent(new CustomEvent('orders-changed'));
      } catch (e) {}

      toast.success(data.message || 'Order permanently deleted.');
    } catch (error: any) {
      console.log(error);
      if (error?.message) {
        toast.error(error.message);
      }
    } finally {
      setActionKey(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return false;

    try {
      setError('');
      setActionKey(`bulk-selected-${tab}`);

      const tabKey = tab.replace('deleted-', '');
      const res = await fetch(buildApiUrl('/api/admin/trash/delete-selected'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAdminAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds, tab: tabKey }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete selected items');
        return false;
      }

      // remove items from UI instantly
      if (tab === 'deleted-orders') setOrders((prev) => prev.filter((p) => !selectedIds.includes(p._id)));
      if (tab === 'deleted-customers') setCustomers((prev) => prev.filter((p) => !selectedIds.includes(p._id)));
      if (tab === 'deleted-products') setProducts((prev) => prev.filter((p) => !selectedIds.includes(p._id)));
      setSelectedIds([]);
      try { fetch(buildApiUrl('/api/admin/dashboard')).catch(()=>null); window.dispatchEvent(new CustomEvent('admin:counts-changed')) } catch(e) {}
      return true;
    } catch (error) {
      console.error('Bulk delete selected error:', error);
      setError('Failed to delete selected items');
      return false;
    } finally {
      setActionKey(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setError('');
      setActionKey(`bulk-all-${tab}`);

      const tabKey = tab.replace('deleted-', '');
      const res = await fetch(buildApiUrl(`/api/admin/trash/delete-all?tab=${tabKey}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete all items');
        return false;
      }

      // clear tab UI instantly
      if (tab === 'deleted-orders') setOrders([]);
      if (tab === 'deleted-customers') setCustomers([]);
      if (tab === 'deleted-products') setProducts([]);
      setSelectedIds([]);
      try { fetch(buildApiUrl('/api/admin/dashboard')).catch(()=>null); window.dispatchEvent(new CustomEvent('admin:counts-changed')) } catch(e) {}
      return true;
    } catch (error) {
      console.error('Bulk delete all error:', error);
      setError('Failed to delete all items');
      return false;
    } finally {
      setActionKey(null);
    }
  };

  const confirmBulkDelete = async () => {
    const didDelete = bulkDeleteMode === 'selected' ? await handleDeleteSelected() : await handleDeleteAll();
    if (didDelete) {
      setShowModal(false);
      setBulkDeleteMode(null);
    }
  };

  const openBulkDeleteModal = (mode: BulkDeleteMode) => {
    setBulkDeleteMode(mode);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trash</h1>
          <p className="text-muted-foreground text-sm">Recover deleted orders and customers.</p>
        </div>
        <Button variant="outline" onClick={fetchDeletedData} className="gap-2 w-full sm:w-auto">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white p-3 rounded-xl border shadow-sm flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTab('deleted-orders');
            try {
              const url = new URL(window.location.href);
              url.searchParams.set('tab', 'deleted-orders');
              window.history.replaceState({}, '', url.toString());
            } catch (e) {}
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'deleted-orders' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Deleted Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('deleted-customers');
            try {
              const url = new URL(window.location.href);
              url.searchParams.set('tab', 'deleted-customers');
              window.history.replaceState({}, '', url.toString());
            } catch (e) {}
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'deleted-customers' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Deleted Customers ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('deleted-products');
            try {
              const url = new URL(window.location.href);
              url.searchParams.set('tab', 'deleted-products');
              window.history.replaceState({}, '', url.toString());
            } catch (e) {}
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'deleted-products' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Deleted Products ({products.length})
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-wrap items-center gap-2">
        <Button
          variant="destructive"
          onClick={() => openBulkDeleteModal('selected')}
          disabled={!anySelected || !!actionKey || loading}
          className="h-9"
        >
          Delete Selected ({selectedIds.length})
        </Button>
        <Button
          variant="outline"
          onClick={() => openBulkDeleteModal('all')}
          disabled={currentRows.length === 0 || !!actionKey || loading}
          className="h-9 border-rose-200 text-rose-700 hover:bg-rose-50"
        >
          Delete All
        </Button>
      </div>

      <div className="rounded-xl border shadow-sm bg-white overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading deleted data...</div>
        ) : currentRows.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No deleted data found.</div>
        ) : tab === 'deleted-orders' ? (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Select all deleted orders"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Order ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Deleted Date</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const restoreKey = `orders-restore-${order._id}`;
                const permanentKey = `orders-permanent-${order._id}`;
                const busy = actionKey === restoreKey || actionKey === permanentKey;

                return (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order._id)}
                        onChange={() => toggleSingleSelection(order._id)}
                        aria-label={`Select order ${order.orderNumber || order._id}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{order.orderId || order.orderNumber || order._id}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customerName || 'Customer'}</td>
                    <td className="px-4 py-3 text-gray-700">{order.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDeletedDate(order.deletedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(order._id, 'deleted-orders')}
                          disabled={busy}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({
                              id: order._id,
                              tab: 'deleted-orders',
                              label: order.orderNumber || order._id,
                            })
                          }
                          disabled={busy}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Permanent Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : tab === 'deleted-customers' ? (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Select all deleted customers"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Deleted Date</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const restoreKey = `customers-restore-${customer._id}`;
                const permanentKey = `customers-permanent-${customer._id}`;
                const busy = actionKey === restoreKey || actionKey === permanentKey;

                return (
                  <tr key={customer._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer._id)}
                        onChange={() => toggleSingleSelection(customer._id)}
                        aria-label={`Select customer ${customer.name || customer.email || customer._id}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{customer.name || 'Customer'}</td>
                    <td className="px-4 py-3 text-gray-700">{customer.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDeletedDate(customer.deletedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(customer._id, 'deleted-customers')}
                          disabled={busy}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({
                              id: customer._id,
                              tab: 'deleted-customers',
                              label: customer.name || customer.email || customer._id,
                            })
                          }
                          disabled={busy}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Permanent Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Select all deleted products"
                  />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Product Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Deleted Date</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const restoreKey = `products-restore-${product._id}`;
                const permanentKey = `products-permanent-${product._id}`;
                const busy = actionKey === restoreKey || actionKey === permanentKey;

                return (
                  <tr key={product._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product._id)}
                        onChange={() => toggleSingleSelection(product._id)}
                        aria-label={`Select product ${product.name || product._id}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{product.name || 'Product'}</td>
                    <td className="px-4 py-3 text-gray-700">{product.sku || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">₹{product.price}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDeletedDate(product.deletedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(product._id, 'deleted-products')}
                          disabled={busy}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({
                              id: product._id,
                              tab: 'deleted-products',
                              label: product.name || product._id,
                            })
                          }
                          disabled={busy}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Permanent Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <DeleteConfirmModal
        open={!!pendingDelete}
        title="Permanent Delete"
        message={`This action cannot be undone. Permanently delete ${pendingDelete?.label || 'this item'}?`}
        isDeleting={!!pendingDelete && actionKey === `${pendingDelete.tab}-permanent-${pendingDelete.id}`}
        onCancel={() => {
          if (!actionKey) setPendingDelete(null);
        }}
        onConfirm={handlePermanentDelete}
      />

      <ConfirmModal
        isOpen={showModal}
        title={bulkDeleteMode === 'selected' ? 'Delete Selected Items' : 'Delete All Items'}
        message={
          bulkDeleteMode === 'selected'
            ? 'Are you sure you want to permanently delete the selected items? This cannot be undone.'
            : 'Are you sure you want to permanently delete all items in this tab? This cannot be undone.'
        }
        confirmLabel={bulkDeleteMode === 'selected' ? 'Delete Selected' : 'Delete All'}
        onConfirm={confirmBulkDelete}
        onCancel={() => {
          if (!actionKey) {
            setShowModal(false);
            setBulkDeleteMode(null);
          }
        }}
        isLoading={!!actionKey}
      />
    </div>
  );
}
