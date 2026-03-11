'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { SalesChart } from '@/components/admin/SalesChart';
import { OrderStatusChart } from '@/components/admin/OrderStatusChart';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

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

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      href: '/admin/products',
      color: 'bg-blue-500/10',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'bg-purple-500/10',
    },
    {
      label: 'Total Customers',
      value: userCount,
      icon: Users,
      href: '/admin/customers',
      color: 'bg-orange-500/10',
    },
    {
      label: 'Revenue',
      value: `$${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(0)}`,
      icon: TrendingUp,
      href: '/admin/orders',
      color: 'bg-green-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back to TN Automation Admin Panel"
      />

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href + stat.label} href={stat.href}>
              <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-2.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View details</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SalesChart orders={orders} />
        <OrderStatusChart orders={orders} />
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Products</h2>
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="text-sm text-gray-400">No products yet.</p>
            ) : (
              products.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    ${product.price}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet.</p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.orderStatus}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    ${order.totalAmount?.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/products?action=add"
            className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-150"
          >
            Add Product
          </Link>
          <Link
            href="/admin/services?action=add"
            className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-150"
          >
            Add Service
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-150"
          >
            View Orders
          </Link>
          <Link
            href="/admin/customers"
            className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-150"
          >
            View Customers
          </Link>
        </div>
      </div>
    </div>
  );
}
