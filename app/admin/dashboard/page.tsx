'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  Plus,
  FolderPlus,
  ClipboardList,
} from 'lucide-react';
import { formatINRCurrency } from '@/lib/currency';
import { buildApiUrl, parseResponseBody } from '@/lib/http-response';
import { Skeleton } from '@/components/ui/skeleton';

const RevenueChart = dynamic(() => import('@/components/admin/RevenueChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] rounded-xl" />,
});

const OrdersStatusChart = dynamic(() => import('@/components/admin/OrdersStatusChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] rounded-xl" />,
});

interface RevenuePoint {
  label: string;
  amount: number;
}

interface RevenueState {
  total: number;
  data: RevenuePoint[];
}

interface OrderStatusDistribution {
  pending: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

interface DashboardOverview {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}

interface LatestOrder {
  _id: string;
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  email?: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
}

interface LatestCustomer {
  _id: string;
  name?: string;
  email?: string;
  createdAt: string;
}

function formatCompactINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatJoinedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getLatestDataErrorMessage(status: number | null, resourceLabel: string) {
  if (status === 401) {
    return `Unauthorized to load ${resourceLabel}. Please sign in again.`;
  }

  if (status && status >= 500) {
    return `Server error while loading ${resourceLabel}.`;
  }

  return `Unexpected response from ${resourceLabel} API.`;
}

const orderStatusStyles: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Ordered: 'bg-blue-100 text-blue-700',
  Packed: 'bg-cyan-100 text-cyan-700',
  Shipped: 'bg-purple-100 text-purple-700',
  'Out for Delivery': 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [overview, setOverview] = useState<DashboardOverview>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [revenue, setRevenue] = useState<RevenueState>({ total: 0, data: [] });
  const [statusData, setStatusData] = useState<OrderStatusDistribution>({
    pending: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [latestOrders, setLatestOrders] = useState<LatestOrder[]>([]);
  const [latestCustomers, setLatestCustomers] = useState<LatestCustomer[]>([]);
  const [latestOrdersError, setLatestOrdersError] = useState('');
  const [latestCustomersError, setLatestCustomersError] = useState('');

  const fetchJsonSafe = useCallback(async <T,>(path: string): Promise<{ ok: boolean; data: T | null; networkError: boolean; status: number | null }> => {
    try {
      const res = await fetch(buildApiUrl(path), {
        cache: 'no-store',
        credentials: 'include',
      });

      const payload = await parseResponseBody<T>(res);
      return {
        ok: res.ok,
        data: (payload as T) || null,
        networkError: false,
        status: res.status,
      };
    } catch {
      return {
        ok: false,
        data: null,
        networkError: true,
        status: null,
      };
    }
  }, []);

  const fetchAnalytics = useCallback(async (selectedFilter: 'today' | '7days' | '30days', isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const filterQuery = `?filter=${selectedFilter}`;

      console.log('Selected Filter:', selectedFilter, 'query:', filterQuery);
      console.log('Fetching dashboard data...');

      const [dashboardResult, revenueResult, orderStatusResult, latestOrdersResult, latestCustomersResult] = await Promise.all([
        fetchJsonSafe<{ data?: { totalProducts?: number; totalOrders?: number; totalCustomers?: number; totalRevenue?: number } }>(`/api/admin/dashboard${filterQuery}`),
        fetchJsonSafe<{ total?: unknown; totalRevenue?: unknown; data?: Array<{ label?: unknown; amount?: unknown }>; daily?: Array<{ label?: unknown; amount?: unknown }>; revenueData?: Array<{ date?: unknown; amount?: unknown; revenue?: unknown }> }>(`/api/admin/revenue${filterQuery}`),
        fetchJsonSafe<OrderStatusDistribution>(`/api/admin/order-status${filterQuery}`),
        fetchJsonSafe<{ success?: boolean; orders?: Array<Record<string, unknown>> }>('/api/admin/latest-orders'),
        fetchJsonSafe<{ success?: boolean; users?: Array<Record<string, unknown>> }>('/api/admin/latest-customers'),
      ]);

      const dashboardPayload = dashboardResult.data;
      const revenuePayload = revenueResult.data;
      const orderStatusPayload = orderStatusResult.data;
      const latestOrdersPayload = latestOrdersResult.data;
      const latestCustomersPayload = latestCustomersResult.data;

      const dashboardData =
        dashboardPayload && typeof dashboardPayload === 'object'
          ? ((dashboardPayload as any).data || dashboardPayload)
          : {};

      const rawRevenueArray = Array.isArray((revenuePayload as any)?.data)
        ? (revenuePayload as any).data
        : Array.isArray((revenuePayload as any)?.daily)
        ? (revenuePayload as any).daily
        : Array.isArray((revenuePayload as any)?.revenueData)
        ? (revenuePayload as any).revenueData
        : Array.isArray((revenuePayload as any)?.data)
        ? (revenuePayload as any).data
        : [];

      const normalizedRevenue = Array.isArray(rawRevenueArray)
        ? rawRevenueArray
            .map((entry: any) => ({
              label: String(entry?.label || entry?.date || entry?._id || ''),
              amount: Number(entry?.amount ?? entry?.revenue ?? entry?.totalRevenue ?? 0),
            }))
            .filter((entry) => Boolean(entry.label))
        : [];

      const revenueValue = Number(
        revenuePayload?.total ||
          (revenuePayload as any)?.totalRevenue ||
          (revenuePayload && (revenuePayload as any).data && (revenuePayload as any).data.totalRevenue) ||
          dashboardData.totalRevenue ||
          0
      );

      setRevenue({ total: revenueValue, data: normalizedRevenue });

      const statusSource = ((orderStatusPayload as any)?.orderStatus || orderStatusPayload || {}) as Partial<OrderStatusDistribution>;
      const latestOrdersSource =
        latestOrdersPayload && typeof latestOrdersPayload === 'object'
          ? latestOrdersPayload
          : null;
      const latestCustomersSource =
        latestCustomersPayload && typeof latestCustomersPayload === 'object'
          ? latestCustomersPayload
          : null;

      const normalizedLatestOrders = Array.isArray(latestOrdersSource?.orders)
        ? latestOrdersSource.orders.map((order: any) => ({
            _id: String(order?._id || ''),
            orderId: String(order?.orderId || order?.orderNumber || order?._id || ''),
            orderNumber: String(order?.orderNumber || order?.orderId || order?._id || ''),
            customerName: String(order?.customerName || order?.user?.name || order?.name || order?.email || 'Customer'),
            email: String(order?.email || order?.user?.email || ''),
            totalAmount: Number(order?.totalAmount ?? order?.total ?? 0),
            orderStatus: String(order?.orderStatus || order?.status || order?.trackingStatus || 'Ordered'),
            createdAt: String(order?.createdAt || ''),
          }))
        : [];

      const normalizedLatestCustomers = Array.isArray(latestCustomersSource?.users)
        ? latestCustomersSource.users.map((customer: any) => ({
            _id: String(customer?._id || ''),
            name: String(customer?.name || ''),
            email: String(customer?.email || ''),
            createdAt: String(customer?.createdAt || ''),
          }))
        : [];

      setOverview((prev) => ({
        ...prev,
        totalProducts: Number(dashboardData.totalProducts || 0),
        totalOrders: Number(dashboardData.totalOrders || 0),
        totalCustomers: Number(dashboardData.totalCustomers || 0),
        totalRevenue: revenueValue,
      }));

      setStatusData({
        pending: Number(statusSource.pending || 0),
        shipped: Number(statusSource.shipped || 0),
        delivered: Number(statusSource.delivered || 0),
        cancelled: Number(statusSource.cancelled || 0),
      });
      setLatestOrders(normalizedLatestOrders);
      setLatestCustomers(normalizedLatestCustomers);
      setLatestOrdersError(
        latestOrdersResult.networkError || !latestOrdersResult.ok || !latestOrdersSource || !Array.isArray(latestOrdersSource.orders)
          ? getLatestDataErrorMessage(latestOrdersResult.status, 'latest orders')
          : ''
      );
      setLatestCustomersError(
        latestCustomersResult.networkError || !latestCustomersResult.ok || !latestCustomersSource || !Array.isArray(latestCustomersSource.users)
          ? getLatestDataErrorMessage(latestCustomersResult.status, 'latest customers')
          : ''
      );

      if (
        dashboardResult.networkError &&
        revenueResult.networkError &&
        orderStatusResult.networkError &&
        latestOrdersResult.networkError &&
        latestCustomersResult.networkError
      ) {
        setErrorMessage('Backend API is unreachable. Please ensure the Express server is running and MongoDB Atlas is accessible.');
      } else if ([dashboardResult, revenueResult, orderStatusResult, latestOrdersResult, latestCustomersResult].some((result) => result.status === 401)) {
        setErrorMessage('Admin session expired or is missing. Please sign in again.');
      } else {
        setErrorMessage('');
      }
    } catch (error) {
      setErrorMessage('Unable to refresh analytics right now. Retrying automatically...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchJsonSafe]);

  useEffect(() => {
    fetchAnalytics(timeFilter, true);
  }, [fetchAnalytics, timeFilter]);

  useEffect(() => {
    const refreshAnalytics = () => {
      fetchAnalytics(timeFilter, false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAnalytics();
      }
    };

    window.addEventListener('admin:counts-changed', refreshAnalytics as EventListener);
    window.addEventListener('focus', refreshAnalytics);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const intervalId = window.setInterval(refreshAnalytics, 20000);

    return () => {
      window.removeEventListener('admin:counts-changed', refreshAnalytics as EventListener);
      window.removeEventListener('focus', refreshAnalytics);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [fetchAnalytics, timeFilter]);

  const kpiCards = useMemo(() => {
    return [
      {
        label: 'Total Products',
        value: overview.totalProducts.toLocaleString('en-IN'),
        icon: Package,
        href: '/admin/products',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        label: 'Total Orders',
        value: overview.totalOrders.toLocaleString('en-IN'),
        icon: ShoppingCart,
        href: '/admin/orders',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
      {
        label: 'Total Customers',
        value: overview.totalCustomers.toLocaleString('en-IN'),
        icon: Users,
        href: '/admin/customers',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
      },
      {
        label: 'Total Revenue',
        value: formatCompactINR(overview.totalRevenue),
        icon: IndianRupee,
        href: '/admin/orders',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
    ];
  }, [overview]);

  return (
    <div className="max-w-[1450px] mx-auto w-full p-4 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Track sales, orders, customers, and revenue with real-time analytics.</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="range" className="text-sm font-medium text-gray-600">Time Filter</label>
          <select
            id="range"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as 'today' | '7days' | '30days')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="group">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    {loading ? (
                      <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-100" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                    )}
                    <p className="text-xs mt-2 text-gray-500">{refreshing ? 'Refreshing...' : 'Live analytics'}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.iconBg}`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueChart
          data={revenue.data}
          loading={loading}
          total={revenue.total}
          range={timeFilter === 'today' ? 'Today' : timeFilter === '30days' ? 'Last 30 Days' : 'Last 7 Days'}
        />
        <OrdersStatusChart
          data={statusData}
          loading={loading}
          subtitle={timeFilter === 'today' ? 'Today' : timeFilter === '30days' ? 'Last 30 days' : 'Last 7 days'}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/products?action=add"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex items-center gap-3 min-w-[220px]"
          >
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Plus className="w-4 h-4" />
            </span>
            <span className="font-medium text-gray-900">Add Product</span>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex items-center gap-3 min-w-[220px]"
          >
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <ClipboardList className="w-4 h-4" />
            </span>
            <span className="font-medium text-gray-900">View Orders</span>
          </Link>

          <Link
            href="/admin/products"
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex items-center gap-3 min-w-[220px]"
          >
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <FolderPlus className="w-4 h-4" />
            </span>
            <span className="font-medium text-gray-900">Add Category</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Orders</h2>
          {latestOrdersError ? (
            <p className="text-sm text-red-600">{latestOrdersError}</p>
          ) : latestOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {latestOrders.map((order) => {
                const statusClass =
                  orderStatusStyles[order.orderStatus] || 'bg-gray-100 text-gray-700';

                return (
                  <Link
                    key={order._id}
                    href={`/admin/orders?orderId=${order._id}`}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 rounded-lg px-2 -mx-2 hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{order.orderId || order.orderNumber || order._id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{order.customerName || order.email || 'Customer'}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusClass}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 text-sm text-right">
                      {formatINRCurrency(order.totalAmount || 0)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Customers</h2>
          {latestCustomersError ? (
            <p className="text-sm text-red-600">{latestCustomersError}</p>
          ) : latestCustomers.length === 0 ? (
            <p className="text-sm text-gray-500">No recent customers</p>
          ) : (
            <div className="space-y-3">
              {latestCustomers.map((customer) => (
                <Link
                  key={customer._id}
                  href={`/admin/customers?customerId=${customer._id}`}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 rounded-lg px-2 -mx-2 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold uppercase">
                      {(customer.name || customer.email || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{customer.name || 'Not Provided'}</p>
                      <p className="text-xs text-gray-500">{customer.email || 'Not Provided'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatJoinedDate(customer.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
