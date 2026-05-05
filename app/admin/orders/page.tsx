'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatINRCurrency } from '@/lib/currency';
import ConfirmModal from '@/components/confirm-modal';
import { Ban, Eye, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';

interface OrderProduct {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

interface DeliveryInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface AddressDetails {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface Order {
  _id: string;
  orderId?: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string | AddressDetails;
  products: OrderProduct[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded' | string;
  status?: string;
  orderStatus: 'Ordered' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
  trackingStatus?: string;
  cancelledBy?: 'USER' | 'ADMIN' | string | null;
  deliveryInfo?: DeliveryInfo;
  createdAt: string;
}

interface OrdersFilters {
  status: string;
  payment: string;
  dateFrom: string;
  dateTo: string;
  minPrice: string;
  maxPrice: string;
}

const ORDER_STATUSES = ['Pending', 'Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] as const;
const ORDERS_PER_PAGE = 10;

const DEFAULT_FILTERS: OrdersFilters = {
  status: 'All',
  payment: 'All',
  dateFrom: '',
  dateTo: '',
  minPrice: '',
  maxPrice: '',
};

const statusStyles: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Ordered: 'bg-yellow-100 text-yellow-800',
  Packed: 'bg-cyan-100 text-cyan-800',
  Shipped: 'bg-blue-100 text-blue-800',
  'Out for Delivery': 'bg-indigo-100 text-indigo-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const paymentStyles: Record<string, string> = {
  Paid: 'bg-green-100 text-green-800',
  Unpaid: 'bg-red-100 text-red-800',
  Refunded: 'bg-gray-100 text-gray-800',
};

function getDisplayStatus(order: Order): string {
  const raw = String(order.status || order.trackingStatus || order.orderStatus || 'Ordered').trim();
  const status = raw.toLowerCase();
  if (status === 'confirmed') return 'Packed';
  if (status === 'outfordelivery' || status === 'out for delivery' || status === 'out_for_delivery') return 'Out for Delivery';
  if (status === 'pending') return 'Pending';
  if (status === 'ordered') return 'Ordered';
  if (status === 'packed') return 'Packed';
  if (status === 'shipped') return 'Shipped';
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return 'Ordered';
}

function getCustomerDisplayName(order: Order): string {
  if (order.customerName?.trim()) return order.customerName;
  const first = order.deliveryInfo?.firstName || '';
  const last = order.deliveryInfo?.lastName || '';
  return `${first} ${last}`.trim() || 'Customer';
}

function getDisplayAddress(order: Order): string {
  if (typeof order.address === 'string' && order.address.trim()) {
    return order.address.trim();
  }

  if (order.address && typeof order.address === 'object') {
    const line1 = [order.address?.fullName, order.address?.address].filter(Boolean).join(', ');
    const line2 = [order.address?.city, order.address?.state, order.address?.pincode].filter(Boolean).join(', ');
    const phone = order.address?.phone ? `Phone: ${order.address.phone}` : '';
    const email = order.address?.email ? `Email: ${order.address.email}` : '';

    return [line1, line2, phone, email].filter(Boolean).join(' | ');
  }

  return [order.deliveryInfo?.street, order.deliveryInfo?.city, order.deliveryInfo?.state, order.deliveryInfo?.zip]
    .filter(Boolean)
    .join(', ');
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [draftFilters, setDraftFilters] = useState<OrdersFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<OrdersFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/api/admin/orders'), { cache: 'no-store', credentials: 'include' });
      const data = await parseResponseBody<any>(res);

      if (!res.ok) {
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredOrders = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const displayStatus = getDisplayStatus(order);
      const statusMatch = appliedFilters.status === 'All' || displayStatus === appliedFilters.status;
      if (!statusMatch) return false;

      const paymentMatch = appliedFilters.payment === 'All' || order.paymentStatus === appliedFilters.payment;
      if (!paymentMatch) return false;

      if (appliedFilters.dateFrom) {
        const fromDate = new Date(appliedFilters.dateFrom);
        if (new Date(order.createdAt) < fromDate) return false;
      }

      if (appliedFilters.dateTo) {
        const toDate = new Date(appliedFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(order.createdAt) > toDate) return false;
      }

      if (appliedFilters.minPrice) {
        const minValue = Number(appliedFilters.minPrice);
        if (!Number.isNaN(minValue) && order.totalAmount < minValue) return false;
      }

      if (appliedFilters.maxPrice) {
        const maxValue = Number(appliedFilters.maxPrice);
        if (!Number.isNaN(maxValue) && order.totalAmount > maxValue) return false;
      }

      if (!query) return true;

      return (
        (order.orderNumber || '').toLowerCase().includes(query) ||
        getCustomerDisplayName(order).toLowerCase().includes(query) ||
        (order.email || '').toLowerCase().includes(query)
      );
    });
  }, [orders, debouncedSearch, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleStatusChange = async (id: string, nextStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch(buildApiUrl(`/api/admin/orders/${id}/status`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await parseResponseBody<any>(res);
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update order status' });
        return;
      }
      setMessage({ type: 'success', text: 'Order status updated successfully' });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ type: 'error', text: 'Failed to update order status' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = (id: string) => {
    if (!id) {
      console.error('❌ Order ID missing');
      setMessage({ type: 'error', text: 'Order ID missing' });
      return;
    }
    setCancelOrderId(id);
    setShowCancelConfirm(true);
  };

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;

    setShowCancelConfirm(false);
    try {
      setCancellingId(cancelOrderId);
      const res = await fetch(buildApiUrl(`/api/admin/orders/${cancelOrderId}/cancel`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled', source: 'admin' }),
      });
      const data = await parseResponseBody<any>(res);

      if (!res.ok) {
        console.error('❌ Cancel failed:', data.error || data.message);
        setMessage({ type: 'error', text: data.error || data.message || 'Failed to cancel order' });
        return;
      }

      setMessage({ type: 'success', text: 'Order cancelled successfully' });
      await fetchOrders();
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      setMessage({ type: 'error', text: 'Failed to cancel order' });
    } finally {
      setCancellingId(null);
      setCancelOrderId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    try {
      setDeletingId(selectedId);
      const res = await fetch(buildApiUrl(`/api/admin/orders/${selectedId}`), { 
        method: 'PATCH', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await parseResponseBody<any>(res);
      
      // ❌ DO NOT assume success
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || data.message || 'Failed to delete order' });
        return;
      }

      // ✅ Success logic
      setShowDeleteModal(false);
      setSelectedId(null);
      setMessage({ type: 'success', text: 'Order moved to trash' });
      
      // Refresh list from server
      await fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      setMessage({ type: 'error', text: 'Failed to delete order' });
    } finally {
      setDeletingId(null);
    }
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <div className="flex justify-between items-center mb-4 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Orders Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage customer orders ({filteredOrders.length} results)</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="gap-2 shrink-0">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Order ID, customer, email"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={draftFilters.status} onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">Status: All</option>
            <option value="Pending">Pending</option>
            <option value="Ordered">Ordered</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select value={draftFilters.payment} onChange={(e) => setDraftFilters((p) => ({ ...p, payment: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">Payment: All</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          <input type="date" value={draftFilters.dateFrom} onChange={(e) => setDraftFilters((p) => ({ ...p, dateFrom: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={draftFilters.dateTo} onChange={(e) => setDraftFilters((p) => ({ ...p, dateTo: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <input type="number" min="0" placeholder="Min Rs" value={draftFilters.minPrice} onChange={(e) => setDraftFilters((p) => ({ ...p, minPrice: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="number" min="0" placeholder="Max Rs" value={draftFilters.maxPrice} onChange={(e) => setDraftFilters((p) => ({ ...p, maxPrice: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white">Apply Filters</Button>
          <Button variant="outline" onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      <div className="rounded-xl shadow-sm border bg-white p-4 md:p-5">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        ) : (
          <div className="space-y-4">
            {paginatedOrders.map((order) => {
              const displayStatus = getDisplayStatus(order);
              const isDelivered = displayStatus === 'Delivered';
              const canCancel = displayStatus === 'Pending' || displayStatus === 'Ordered';

              return (
                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
                  <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_1.3fr] lg:items-center">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">#{order.orderNumber || order._id}</p>
                      <p className="text-sm text-gray-700 mt-1 truncate">{getCustomerDisplayName(order)}</p>
                      <p className="text-xs text-gray-500 truncate">{order.email || order.deliveryInfo?.email || '-'}</p>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-center">
                      <p className="font-bold text-lg text-gray-900">{formatINRCurrency(order.totalAmount)}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${paymentStyles[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>{order.paymentStatus}</span>
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusStyles[displayStatus] || 'bg-gray-100 text-gray-800'}`}>{displayStatus}</span>
                        {displayStatus === 'Cancelled' && order.cancelledBy === 'USER' && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-rose-100 text-rose-800">
                            Cancelled by user
                          </span>
                        )}
                        {displayStatus === 'Cancelled' && order.cancelledBy === 'ADMIN' && (
                          <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-800">
                            Cancelled by admin
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-md border-gray-300 px-3 text-xs text-gray-700 hover:bg-gray-100"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> View
                      </Button>

                      <select
                        value={displayStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>

                      {!isDelivered && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={`h-8 rounded-md px-3 text-xs transition-colors ${
                            canCancel
                              ? 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'border-gray-200 bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed'
                          }`}
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={!canCancel || cancellingId === order._id}
                        >
                          <Ban className="mr-1 h-3.5 w-3.5" />
                          {cancellingId === order._id ? 'Cancelling...' : canCancel ? 'Cancel' : 'Locked'}
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(order._id)}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-red-500 px-3 text-xs text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === order._id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === order._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700">Order ID: {selectedOrder.orderId || selectedOrder.orderNumber || selectedOrder._id}</p>
              <p className="text-sm text-gray-700">Customer: {getCustomerDisplayName(selectedOrder)}</p>
              <p className="text-sm text-gray-700">Email: {selectedOrder.email || selectedOrder.deliveryInfo?.email || '-'}</p>
              <p className="text-sm text-gray-700">Phone: {selectedOrder.phone || selectedOrder.deliveryInfo?.phone || '-'}</p>
              <p className="text-sm text-gray-700">
                Address: {getDisplayAddress(selectedOrder) || '-'}
              </p>
              <p className="text-sm text-gray-700">Payment Status: {selectedOrder.paymentStatus || 'Unpaid'}</p>
              <p className="text-sm text-gray-700">Order Date &amp; Time: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p className="text-sm text-gray-700 mt-3 font-semibold">Total: {formatINRCurrency(selectedOrder.totalAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 text-red-500 p-2 rounded-full" aria-hidden="true">
                ⚠️
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            </div>

            <p className="text-gray-600 text-sm mb-6">Are you sure you want to delete this order?</p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!deletingId) {
                    setShowDeleteModal(false);
                    setSelectedId(null);
                  }
                }}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={!selectedId || !!deletingId}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel Order"
        description="Canceling this order will keep it in the system but mark it as cancelled. Do you want to continue?"
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        isLoading={Boolean(cancellingId)}
        onOpenChange={(open) => {
          if (!open && !cancellingId) setShowCancelConfirm(false);
        }}
        onConfirm={confirmCancelOrder}
      />
    </div>
  );
}
