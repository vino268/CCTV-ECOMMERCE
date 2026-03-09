'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to TN Automation Admin Panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href + stat.label} href={stat.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Recent Products
          </h2>
          <div className="space-y-4">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            ) : (
              products.slice(0, 5).map((product) => (
                <div key={product._id} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.category}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    ${product.price}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Recent Orders
          </h2>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderStatus}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    ${order.totalAmount?.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border border-border bg-gradient-to-r from-primary/10 to-secondary/10">
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/admin/products?action=add" className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-center">
            <p className="font-semibold text-foreground text-sm">Add Product</p>
          </Link>
          <Link href="/admin/services?action=add" className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-center">
            <p className="font-semibold text-foreground text-sm">Add Service</p>
          </Link>
          <Link href="/admin/orders" className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-center">
            <p className="font-semibold text-foreground text-sm">View Orders</p>
          </Link>
          <Link href="/admin/customers" className="p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow text-center">
            <p className="font-semibold text-foreground text-sm">View Customers</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
