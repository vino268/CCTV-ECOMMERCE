'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, Package, Pencil, Check, X } from 'lucide-react';

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

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
};

const EDIT_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

export default function UserOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    phone: '', street: '', city: '', state: '', zip: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const canEdit = (order: Order) =>
    Date.now() - new Date(order.createdAt).getTime() < EDIT_WINDOW_MS;

  const openEdit = (order: Order) => {
    setEditOrderId(order._id);
    setEditForm({
      phone:  order.deliveryInfo?.phone  || '',
      street: order.deliveryInfo?.street || '',
      city:   order.deliveryInfo?.city   || '',
      state:  order.deliveryInfo?.state  || '',
      zip:    order.deliveryInfo?.zip    || '',
    });
  };

  const handleSaveEdit = async (orderId: string) => {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryInfo: {
            phone:  editForm.phone,
            street: editForm.street,
            city:   editForm.city,
            state:  editForm.state,
            zip:    editForm.zip,
          },
        }),
      });
      if (res.ok) {
        setEditOrderId(null);
        const stored = localStorage.getItem('user');
        if (stored) fetchOrders(JSON.parse(stored).email);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update order');
      }
    } catch {
      alert('Failed to update order');
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/account');
      return;
    }

    const user = JSON.parse(stored);
    fetchOrders(user.email);
  }, [router]);

  const fetchOrders = async (email: string) => {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const all: Order[] = await res.json();
        const userOrders = all.filter(
          (o) => o.email.toLowerCase() === email.toLowerCase()
        );
        setOrders(userOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <Link href="/account">
          <Button variant="outline" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Account
          </Button>
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? 's' : ''} placed
            </p>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="border border-border rounded-xl p-12 bg-card text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No orders yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Your orders will appear here after you make a purchase.
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-border rounded-xl bg-card overflow-hidden"
              >
                {/* Order header */}
                <div className="bg-muted/30 px-6 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        ORDER NUMBER
                      </p>
                      <p className="font-semibold text-foreground">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        DATE PLACED
                      </p>
                      <p className="text-sm text-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">TOTAL</p>
                      <p className="font-bold text-primary">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.orderStatus] ||
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Products */}
                <div className="p-6">
                  <div className="space-y-3">
                    {order.products.map((p, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-foreground">
                          <Link
                            href={`/products/${p.productId}`}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {p.productName}
                          </Link>{' '}
                          <span className="text-muted-foreground">
                            x{p.quantity}
                          </span>
                        </span>
                        <span className="font-medium text-foreground">
                          ${(p.productPrice * p.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery info */}
                  {order.deliveryInfo && (
                    <div className="mt-4 pt-4 border-t border-border text-sm">
                      <p className="text-xs text-muted-foreground mb-1">
                        DELIVERY TO
                      </p>
                      <p className="text-foreground font-medium">
                        {order.deliveryInfo.firstName}{' '}
                        {order.deliveryInfo.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        {order.deliveryInfo.street},{' '}
                        {order.deliveryInfo.city},{' '}
                        {order.deliveryInfo.state}{' '}
                        {order.deliveryInfo.zip}
                      </p>
                      <p className="text-muted-foreground">
                        {order.deliveryInfo.phone}
                      </p>
                    </div>
                  )}

                  {/* Edit Order — visible for 12 hours after placement */}
                  {canEdit(order) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {editOrderId !== order._id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openEdit(order)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit Order
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-foreground">Edit Delivery Info</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                              <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="Phone"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Street</label>
                              <Input
                                value={editForm.street}
                                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                                placeholder="Street address"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">City</label>
                              <Input
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                placeholder="City"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">State</label>
                              <Input
                                value={editForm.state}
                                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                placeholder="State"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">ZIP</label>
                              <Input
                                value={editForm.zip}
                                onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                                placeholder="ZIP code"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => handleSaveEdit(order._id)}
                              disabled={editSaving}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {editSaving ? 'Saving…' : 'Save Changes'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => setEditOrderId(null)}
                              disabled={editSaving}
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
