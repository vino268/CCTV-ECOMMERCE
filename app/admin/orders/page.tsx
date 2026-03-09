'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
}

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
};

const paymentColors: Record<string, string> = {
  Paid: 'bg-green-100 text-green-800',
  Unpaid: 'bg-red-100 text-red-800',
  Refunded: 'bg-gray-100 text-gray-800',
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
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (res.ok) {
        await fetchOrders();
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders ({orders.length} total)
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Orders Table */}
      <Card className="border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-2">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Orders will appear here once customers place them.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Order #
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="p-4 text-center text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-medium text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="p-4 text-foreground">
                      {order.customerName}
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {order.email}
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.orderStatus] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        disabled={updatingId === order._id}
                        className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
