'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

interface DeletedOrder {
  _id: string;
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

type TrashTab = 'orders' | 'customers';

type PendingDelete = {
  id: string;
  tab: TrashTab;
  label: string;
} | null;

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
  const [tab, setTab] = useState<TrashTab>('orders');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DeletedOrder[]>([]);
  const [customers, setCustomers] = useState<DeletedCustomer[]>([]);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const fetchDeletedData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/deleted`, { cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers/deleted`, { cache: 'no-store' }),
      ]);

      if (!ordersRes.ok || !customersRes.ok) {
        throw new Error('Failed to fetch deleted data');
      }

      const [ordersData, customersData] = await Promise.all([
        ordersRes.json(),
        customersRes.json(),
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (error) {
      console.error('Error fetching trash data:', error);
      setOrders([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedData();
  }, []);

  const currentRows = useMemo(() => (tab === 'orders' ? orders : customers), [tab, orders, customers]);

  const handleRestore = async (id: string, currentTab: TrashTab) => {
    try {
      const key = `${currentTab}-restore-${id}`;
      setActionKey(key);

      const endpoint =
        currentTab === 'orders'
          ? `/api/admin/orders/${id}/restore`
          : `/api/admin/customers/${id}/restore`;

      const res = await fetch(endpoint, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'Failed to restore item');
        return;
      }

      await fetchDeletedData();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setActionKey(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!pendingDelete) return;

    try {
      const key = `${pendingDelete.tab}-permanent-${pendingDelete.id}`;
      setActionKey(key);

      const endpoint =
        pendingDelete.tab === 'orders'
          ? `/api/admin/orders/${pendingDelete.id}/permanent`
          : `/api/admin/customers/${pendingDelete.id}/permanent`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'Failed to permanently delete item');
        return;
      }

      setPendingDelete(null);
      await fetchDeletedData();
    } catch (error) {
      console.error('Permanent delete error:', error);
    } finally {
      setActionKey(null);
    }
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

      <div className="bg-white p-3 rounded-xl border shadow-sm flex gap-2">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'orders' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Deleted Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('customers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === 'customers' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Deleted Customers ({customers.length})
        </button>
      </div>

      <div className="rounded-xl border shadow-sm bg-white overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading deleted data...</div>
        ) : currentRows.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No deleted data found.</div>
        ) : tab === 'orders' ? (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
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
                    <td className="px-4 py-3 text-gray-900 font-medium">{order.orderNumber || order._id}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customerName || 'Customer'}</td>
                    <td className="px-4 py-3 text-gray-700">{order.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDeletedDate(order.deletedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(order._id, 'orders')}
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
                              tab: 'orders',
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
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
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
                    <td className="px-4 py-3 text-gray-900 font-medium">{customer.name || 'Customer'}</td>
                    <td className="px-4 py-3 text-gray-700">{customer.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDeletedDate(customer.deletedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(customer._id, 'customers')}
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
                              tab: 'customers',
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
    </div>
  );
}
