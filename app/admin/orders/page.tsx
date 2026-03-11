'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';

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

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(search)}`, { cache: 'no-store' });
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
  }, [search]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (res.ok) {
        await fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
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
      <PageHeader
        title="Orders"
        description={`Manage customer orders (${orders.length} total)`}
        action={
          <Button variant="outline" onClick={fetchOrders} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search order ID, customer name, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-80"
        />
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
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const locked =
                          order.orderStatus?.toLowerCase() === 'cancelled' ||
                          order.orderStatus?.toLowerCase() === 'delivered';
                        return (
                          <select
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                            disabled={locked || updatingId === order._id}
                            title={locked ? 'This order status is locked' : undefined}
                            className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
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
      </Card>
    </div>
  );
}
