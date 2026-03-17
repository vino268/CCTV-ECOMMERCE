'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, Package, Pencil, Check, X, Ban, Lock, Eye, Phone } from 'lucide-react';
import { formatINRCurrency } from '@/lib/currency';

interface OrderProduct {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}


const CANCEL_REASONS = [
  'Incorrect product ordered',
  'Product not required anymore',
  'Cash issue',
  'Ordered by mistake',
  'Wants to change model',
  'Delayed delivery cancellation',
  'Duplicate order',
];

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
  trackingStatus: string;
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
  Ordered: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  OutForDelivery: 'bg-orange-100 text-orange-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  Ordered: 'Ordered',
  Confirmed: 'Confirmed',
  Shipped: 'Shipped',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

export default function UserOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    phone: '', street: '', city: '', state: '', zip: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canModify = (order: Order) => {
    const status = order.trackingStatus || order.orderStatus;
    return ['Ordered', 'Confirmed'].includes(status);
  };

  const isShippedOrBeyond = (order: Order) => {
    const status = order.trackingStatus || order.orderStatus;
    return ['Shipped', 'OutForDelivery', 'Delivered'].includes(status);
  };

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

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        const stored = localStorage.getItem('user');
        if (stored) fetchOrders(JSON.parse(stored).email);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to cancel order');
      }
    } catch {
      alert('Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
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
      const res = await fetch(`/api/orders/user?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      if (res.ok) {
        const userOrders: Order[] = await res.json();
        setOrders(userOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Main return block
  return (
    <div className="w-full max-w-full px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ArrowLeft className="w-5 h-5 cursor-pointer" onClick={() => router.push('/account')} />
        My Orders
      </h1>
      <div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No orders found.</div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order._id} className="border rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="flex flex-col w-full sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                      <div className="text-lg font-semibold text-foreground">Order #{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.trackingStatus || order.orderStatus]}`}>{statusLabels[order.trackingStatus || order.orderStatus]}</div>
                  </div>
                  <div className="space-y-3">
                    {order.products.map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-sm w-full">
                        <span className="text-foreground">
                          <Link href={`/products/${p.productId}`} className="hover:text-primary hover:underline transition-colors">
                            {p.productName}
                          </Link>{' '}
                          <span className="text-muted-foreground">x{p.quantity}</span>
                        </span>
                        <span className="font-medium text-foreground">{formatINRCurrency(p.productPrice * p.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  {order.deliveryInfo && (
                    <div className="mt-4 pt-4 border-t border-border text-sm">
                      <p className="text-xs text-muted-foreground mb-1">DELIVERY TO</p>
                      <p className="text-foreground font-medium">{order.deliveryInfo.firstName} {order.deliveryInfo.lastName}</p>
                      <p className="text-muted-foreground">{order.deliveryInfo.street}, {order.deliveryInfo.city}, {order.deliveryInfo.state} {order.deliveryInfo.zip}</p>
                      <p className="text-muted-foreground">{order.deliveryInfo.phone}</p>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2 w-full">
                      <Link href={`/account/orders/${order._id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-3.5 h-3.5" />
                          Track Order
                        </Button>
                      </Link>
                      {canModify(order) && editOrderId !== order._id && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(order)}>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit Delivery Info
                        </Button>
                      )}
                      {canModify(order) && editOrderId !== order._id && (
                        <Button variant="destructive" size="sm" className="gap-2" onClick={() => handleCancelOrder(order._id)} disabled={cancellingId === order._id}>
                          <Ban className="w-3.5 h-3.5" />
                          {cancellingId === order._id ? 'Cancelling…' : 'Cancel Order'}
                        </Button>
                      )}
                    </div>
                    {editOrderId === order._id && (
                      <div className="w-full mt-3 space-y-3">
                        <p className="text-sm font-semibold text-foreground">Edit Delivery Info</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                            <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Street</label>
                            <Input value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} placeholder="Street address" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">City</label>
                            <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">State</label>
                            <Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} placeholder="State" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">ZIP</label>
                            <Input value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })} placeholder="ZIP code" />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full">
                          <Button size="sm" className="gap-2" onClick={() => handleSaveEdit(order._id)} disabled={editSaving}>
                            <Check className="w-3.5 h-3.5" />
                            {editSaving ? 'Saving…' : 'Save Changes'}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditOrderId(null)} disabled={editSaving}>
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    {isShippedOrBeyond(order) && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 w-full">
                        <p className="text-sm text-muted-foreground">Order already shipped. Contact support for cancellation.</p>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Phone className="w-3.5 h-3.5" />
                          Request Cancellation
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
