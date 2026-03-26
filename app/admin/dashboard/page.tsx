'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  Plus,
  FolderPlus,
  ClipboardList,
} from 'lucide-react';
import RevenueChart from '@/components/admin/RevenueChart';
import OrdersStatusChart from '@/components/admin/OrdersStatusChart';
import { formatINRCurrency } from '@/lib/currency';

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

interface DashboardOverview {
  range: 'today' | '7d' | '30d';
  kpis: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
  };
  growth: {
    products: number;
    orders: number;
    customers: number;
    revenue: number;
  };
  charts: {
    revenue: RevenuePoint[];
    ordersStatus: StatusPoint[];
  };
  recent: {
    orders: Array<{
      _id: string;
      orderNumber?: string;
      customerName?: string;
      email?: string;
      totalAmount: number;
      orderStatus: string;
      createdAt: string;
    }>;
    customers: Array<{
      _id: string;
      name?: string;
      email?: string;
      createdAt: string;
    }>;
  };
}

const emptyOverview: DashboardOverview = {
  range: '7d',
  kpis: {
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  },
  growth: {
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  },
  charts: {
    revenue: [],
    ordersStatus: [],
  },
  recent: {
    orders: [],
    customers: [],
  },
};

function formatCompactINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function growthMeta(growth: number) {
  const positive = growth >= 0;
  return {
    text: `${positive ? '+' : ''}${growth.toFixed(1)}% this week`,
    className: positive ? 'text-green-600' : 'text-red-600',
  };
}

const orderStatusStyles: Record<string, string> = {
  Ordered: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-purple-100 text-purple-700',
  OutForDelivery: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview>(emptyOverview);

  const fetchOverview = async (nextRange: 'today' | '7d' | '30d') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics/overview?range=${nextRange}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setOverview(data);
    } catch (error) {
      console.error('Failed to fetch dashboard overview:', error);
      setOverview(emptyOverview);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(range);
  }, [range]);

  const kpiCards = useMemo(() => {
    return [
      {
        label: 'Total Products',
        value: overview.kpis.totalProducts.toLocaleString('en-IN'),
        icon: Package,
        href: '/admin/products',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        growth: overview.growth.products,
      },
      {
        label: 'Total Orders',
        value: overview.kpis.totalOrders.toLocaleString('en-IN'),
        icon: ShoppingCart,
        href: '/admin/orders',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        growth: overview.growth.orders,
      },
      {
        label: 'Total Customers',
        value: overview.kpis.totalCustomers.toLocaleString('en-IN'),
        icon: Users,
        href: '/admin/customers',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        growth: overview.growth.customers,
      },
      {
        label: 'Total Revenue',
        value: formatCompactINR(overview.kpis.totalRevenue),
        icon: IndianRupee,
        href: '/admin/orders',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        growth: overview.growth.revenue,
      },
    ];
  }, [overview]);

  const chartSubtitle =
    range === 'today'
      ? 'Today'
      : range === '30d'
      ? 'Last 30 days'
      : 'Last 7 days';

  return (
    <div className="max-w-[1450px] mx-auto w-full p-4 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Track sales, orders, and customer growth in real time.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Time Filter</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as 'today' | '7d' | '30d')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const growth = growthMeta(card.growth);
          return (
            <Link key={card.label} href={card.href} className="group">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                    <p className={`text-xs mt-2 ${growth.className}`}>{growth.text}</p>
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
          data={overview.charts.revenue}
          loading={loading}
          subtitle={chartSubtitle}
        />
        <OrdersStatusChart
          data={overview.charts.ordersStatus}
          loading={loading}
          subtitle={chartSubtitle}
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
          {overview.recent.orders.length === 0 ? (
            <p className="text-sm text-gray-500">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {overview.recent.orders.map((order) => {
                const statusClass =
                  orderStatusStyles[order.orderStatus] || 'bg-gray-100 text-gray-700';

                return (
                  <Link
                    key={order._id}
                    href={`/admin/orders?orderId=${order._id}`}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 rounded-lg px-2 -mx-2 hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{order.orderNumber || order._id}</p>
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
          {overview.recent.customers.length === 0 ? (
            <p className="text-sm text-gray-500">No recent customers</p>
          ) : (
            <div className="space-y-3">
              {overview.recent.customers.map((customer) => (
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
                    {new Date(customer.createdAt).toLocaleDateString('en-IN')}
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
