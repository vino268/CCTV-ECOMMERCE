'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatINRCurrency } from '@/lib/currency';

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
  phone: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingStatus: string;
  deliveryInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelComment?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Ordered: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['OutForDelivery'],
  OutForDelivery: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const statusColors: Record<string, string> = {
  Ordered: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  Confirmed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Shipped: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  OutForDelivery: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
};

const statusLabels: Record<string, string> = {
  Ordered: 'Ordered',
  Confirmed: 'Confirmed',
  Shipped: 'Shipped',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

const paymentColors: Record<string, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Unpaid: 'bg-red-50 text-red-700 ring-red-600/20',
  Refunded: 'bg-gray-50 text-gray-600 ring-gray-500/20',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage customer orders &middot; {orders.length} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search orders..."
            className="border rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto w-full">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
            <p className="text-sm text-gray-400">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-medium text-gray-500 mb-1">No orders yet</p>
            <p className="text-sm text-gray-400">
              Orders will appear here once customers place them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[700px] w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="transition-colors duration-150 hover:bg-blue-50/30"
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 hidden lg:table-cell">
                      {order.email}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                      {formatINRCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          paymentColors[order.paymentStatus] || 'bg-gray-50 text-gray-600 ring-gray-500/20'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {(() => {
                        const status = order.trackingStatus || order.orderStatus;
                        if (status === 'Cancelled') {
                          return (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20'}`}>
                                {statusLabels[status] || status}
                              </span>
                              {order.cancelReason && (
                                <div className="text-xs text-red-700 mt-1">Reason: {order.cancelReason}</div>
                              )}
                              {order.cancelComment && (
                                <div className="text-xs text-gray-500">{order.cancelComment}</div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              statusColors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20'
                            }`}
                          >
                            {statusLabels[status] || status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {(() => {
                        const status = order.trackingStatus || order.orderStatus;
                        const allowed = ALLOWED_TRANSITIONS[status] ?? [];
                        const allStatuses = ['Ordered', 'Confirmed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'];

                        if (allowed.length === 0) {
                          return (
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                statusColors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20'
                              }`}
                            >
                              {statusLabels[status] || status}
                            </span>
                          );
                        }
                        return (
                          <select
                            value={status}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                            disabled={updatingId === order._id}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                          >
                            {allStatuses.map((s) => (
                              <option
                                key={s}
                                value={s}
                                disabled={s !== status && !allowed.includes(s)}
                              >
                                {statusLabels[s] || s}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
