'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import RevenueChart from '@/components/admin/RevenueChart';
import OrdersStatusChart from '@/components/admin/OrdersStatusChart';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
}

const statusDot: Record<string, string> = {
  Ordered: 'bg-yellow-400',
  Confirmed: 'bg-blue-400',
  Shipped: 'bg-purple-400',
  OutForDelivery: 'bg-orange-400',
  Delivered: 'bg-emerald-400',
  Cancelled: 'bg-red-400',
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error fetching products:', err));

    fetch('/api/orders', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error('Error fetching orders:', err));

    fetch('/api/users', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setUserCount(Array.isArray(data) ? data.length : 0))
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      href: '/admin/products',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: ShoppingCart,
      href: '/admin/orders',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Customers',
      value: userCount,
      icon: Users,
      href: '/admin/customers',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Revenue',
      value: `₹${revenue.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      href: '/admin/orders',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Welcome back — here&apos;s what&apos;s happening with TN Automation today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="group">
              <div className="bg-white rounded-2xl shadow-sm border p-6 transition-all duration-200 hover:shadow-md hover:border-slate-300">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`${stat.iconBg} ${stat.iconColor} flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <RevenueChart />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <OrdersStatusChart />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Products
            </h2>
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">
                No products yet.
              </p>
            ) : (
              products.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {product.category}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{product.price}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">
                No orders yet.
              </p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        statusDot[order.orderStatus] || 'bg-gray-300'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.orderStatus}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{order.totalAmount?.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { href: '/admin/products?action=add', label: 'Add Product', icon: Package },
            { href: '/admin/services?action=add', label: 'Add Service', icon: ShoppingCart },
            { href: '/admin/orders', label: 'View Orders', icon: ShoppingCart },
            { href: '/admin/customers', label: 'View Customers', icon: Users },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href + action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:border-blue-600 hover:bg-blue-600 hover:shadow-sm"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-transform group-hover:scale-105 group-hover:bg-blue-700">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-slate-900 group-hover:text-white">
                  {action.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
