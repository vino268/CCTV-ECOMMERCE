'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatINRCurrency } from '@/lib/currency';
import { Eye, RefreshCw, Search, Trash2, UserX, UserCheck, X } from 'lucide-react';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  totalOrders?: number;
  totalSpent?: number;
}

interface CustomerOrder {
  _id: string;
  orderNumber?: string;
  createdAt: string;
  orderStatus: string;
  trackingStatus?: string;
  totalAmount: number;
}

const ITEMS_PER_PAGE = 10;

type CustomerFilter = 'all' | 'active' | 'deleted';

function normalizeStatus(status: string) {
  if (status === 'Confirmed') return 'Packed';
  if (status === 'OutForDelivery') return 'Out for Delivery';
  if (status === 'Pending') return 'Pending';
  return status || 'Ordered';
}

function toDisplayValue(value?: string) {
  if (!value || !value.trim()) {
    return <span className="text-gray-400">Not Provided</span>;
  }
  return value;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<CustomerOrder[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Customer | null>(null);
  const [deleteType, setDeleteType] = useState<'customer' | ''>('');

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('status', filter);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filter]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const onVisibleOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchCustomers();
      }
    };

    window.addEventListener('focus', onVisibleOrFocus);
    document.addEventListener('visibilitychange', onVisibleOrFocus);

    return () => {
      window.removeEventListener('focus', onVisibleOrFocus);
      document.removeEventListener('visibilitychange', onVisibleOrFocus);
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    if (filter === 'active') {
      return customers.filter((customer) => !customer.isDeleted);
    }

    if (filter === 'deleted') {
      return customers.filter((customer) => !!customer.isDeleted);
    }

    return customers;
  }, [customers, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const openCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingCustomerOrders(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers/${customer._id}/orders`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch customer orders');
      const data = await res.json();
      setSelectedCustomerOrders(data);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setSelectedCustomerOrders([]);
    } finally {
      setLoadingCustomerOrders(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem || deleteType !== 'customer') return;

    const customerId = deleteItem._id;

    try {
      setActionLoadingId(customerId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'Failed to delete customer');
        return;
      }

      if (selectedCustomer?._id === customerId) {
        setSelectedCustomer(null);
        setSelectedCustomerOrders([]);
      }

      setDeleteItem(null);
      setDeleteType('');
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBlockCustomer = async (customer: Customer) => {
    try {
      setActionLoadingId(customer._id);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers/${customer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !customer.isBlocked }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to update customer status');
        return;
      }

      await fetchCustomers();
    } catch (error) {
      console.error('Error updating customer status:', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setFilter('all');
    setCurrentPage(1);
    fetchCustomers();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Customers Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Customer management with insights and controls ({filteredCustomers.length} results)
          </p>
        </div>
        <Button variant="outline" onClick={fetchCustomers} className="gap-2 w-full sm:w-auto">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow border p-4 grid md:grid-cols-[1fr_220px_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as CustomerFilter);
            setCurrentPage(1);
          }}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Users</option>
          <option value="active">Active Users</option>
          <option value="deleted">Deleted Users</option>
        </select>

        <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto">Reset</Button>
      </div>

      <div className="bg-white rounded-xl shadow border">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading customers...</div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Joined</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Orders</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Spent</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => {
                  const name = customer.name || 'User';
                  const totalOrders = customer.totalOrders || 0;
                  const totalSpent = customer.totalSpent || 0;
                  const isImportant = totalOrders >= 5 || totalSpent >= 50000;

                  return (
                    <tr
                      key={customer._id}
                      className={`border-b hover:bg-gray-50 transition ${
                        customer.isDeleted ? 'opacity-50' : isImportant ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold uppercase">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            {isImportant && (
                              <p className="text-xs text-amber-700">Important Customer</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{toDisplayValue(customer.email)}</td>
                      <td className="px-4 py-3 text-gray-600">{toDisplayValue(customer.phone)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{totalOrders}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">
                        {formatINRCurrency(totalSpent)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {customer.isDeleted ? (
                            <>
                              <span className="text-red-500 text-xs font-medium">
                                Deleted
                              </span>
                              {customer.deletedAt ? (
                                <p className="text-xs text-gray-400">
                                  Deleted on: {new Date(customer.deletedAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                customer.isBlocked
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {customer.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => openCustomerDetails(customer)}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className={`gap-1 ${
                              customer.isBlocked
                                ? 'text-green-700 border-green-200 hover:bg-green-50'
                                : 'text-amber-700 border-amber-200 hover:bg-amber-50'
                            }`}
                            onClick={() => handleToggleBlockCustomer(customer)}
                            disabled={actionLoadingId === customer._id || !!customer.isDeleted}
                          >
                            {customer.isBlocked ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> Unblock
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" /> Block
                              </>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                            onClick={() => {
                              setDeleteItem(customer);
                              setDeleteType('customer');
                            }}
                            disabled={actionLoadingId === customer._id || !!customer.isDeleted}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {customer.isDeleted ? 'Deleted' : 'Delete'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl shadow border px-4 py-3">
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Customer Details</h2>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setSelectedCustomerOrders([]);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Profile</h3>
                  <p className="text-sm text-gray-700">Full Name: {toDisplayValue(selectedCustomer.name)}</p>
                  <p className="text-sm text-gray-700">Email: {toDisplayValue(selectedCustomer.email)}</p>
                  <p className="text-sm text-gray-700">Phone: {toDisplayValue(selectedCustomer.phone)}</p>
                  <p className="text-sm text-gray-700">Address: {toDisplayValue(selectedCustomer.address)}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Insights</h3>
                  <p className="text-sm text-gray-700">
                    Joined Date:{' '}
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-700">
                    Total Orders: {selectedCustomer.totalOrders || 0}
                  </p>
                  <p className="text-sm text-gray-700">
                    Total Spent: {formatINRCurrency(selectedCustomer.totalSpent || 0)}
                  </p>
                  <p className="text-sm text-gray-700">
                    Status: {selectedCustomer.isDeleted ? 'Deleted' : selectedCustomer.isBlocked ? 'Blocked' : 'Active'}
                  </p>
                  {selectedCustomer.isDeleted && selectedCustomer.deletedAt ? (
                    <p className="text-xs text-gray-400">
                      Deleted on:{' '}
                      {new Date(selectedCustomer.deletedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Order History</h3>

                {loadingCustomerOrders ? (
                  <p className="text-sm text-gray-500">Loading order history...</p>
                ) : selectedCustomerOrders.length === 0 ? (
                  <p className="text-sm text-gray-500">No orders placed by this customer.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Order ID</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Date</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Status</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomerOrders.map((order) => {
                          const status = normalizeStatus(order.trackingStatus || order.orderStatus);
                          return (
                            <tr key={order._id} className="border-b last:border-b-0">
                              <td className="px-3 py-2 text-gray-900 font-medium">
                                {order.orderNumber || order._id}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('en-IN')}
                              </td>
                              <td className="px-3 py-2 text-gray-600">{status}</td>
                              <td className="px-3 py-2 text-gray-900 font-medium">
                                {formatINRCurrency(order.totalAmount || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteItem && deleteType === 'customer'}
        message={`Are you sure you want to delete this customer${deleteItem?.name ? ` (${deleteItem.name})` : ''}?`}
        isDeleting={!!deleteItem && actionLoadingId === deleteItem._id}
        onCancel={() => {
          setDeleteItem(null);
          setDeleteType('');
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
