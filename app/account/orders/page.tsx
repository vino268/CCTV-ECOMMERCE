'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, Package, Pencil, Trash2, Check, X, Download, MapPin } from 'lucide-react';

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
  distance?: number;
  deliveryCharge?: number;
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
  Cancelled: 'bg-red-100 text-red-700',
};

/** Edit and Delete are allowed only while the order is Pending or Shipped. */
const canEdit = (order: Order) => {
  const s = order.orderStatus?.toLowerCase();
  return s === 'pending' || s === 'shipped';
};

/* ── Tracking timeline helpers ───────────────────────────── */
const TIMELINE_STEPS = [
  { key: 'placed',           label: 'Order Placed',     desc: 'We received your order' },
  { key: 'confirmed',        label: 'Confirmed',         desc: 'Order has been confirmed' },
  { key: 'shipped',          label: 'Shipped',           desc: 'On its way to you' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  desc: 'Out for delivery in your area' },
  { key: 'delivered',        label: 'Delivered',         desc: 'Order delivered successfully' },
];

function getStepIndex(status: string): number {
  const s = status?.toLowerCase();
  if (s === 'cancelled') return -1;
  if (s === 'delivered') return 4;
  if (s === 'out for delivery') return 3;
  if (s === 'shipped') return 2;
  if (s === 'confirmed') return 1;
  return 0; // pending / processing
}

function OrderTimeline({ status }: { status: string }) {
  const isCancelled = status?.toLowerCase() === 'cancelled';
  const activeStep = getStepIndex(status);

  if (isCancelled) return null;

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5" /> Order Tracking
      </p>
      <div className="flex items-start gap-0">
        {TIMELINE_STEPS.map((step, i) => {
          const done = i <= activeStep;
          const current = i === activeStep;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Connector line + dot row */}
              <div className="flex items-center w-full">
                {/* Left line */}
                <div className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : done ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                {/* Dot */}
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    done
                      ? current
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>
                {/* Right line */}
                <div className={`h-0.5 flex-1 ${i === TIMELINE_STEPS.length - 1 ? 'invisible' : done && i < activeStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </div>
              {/* Label */}
              <div className="text-center mt-2 px-1">
                <p className={`text-xs font-medium leading-tight ${done ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  {step.label}
                </p>
                {current && (
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{step.desc}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Invoice PDF generator ───────────────────────────────── */
async function downloadInvoice(order: Order) {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  const LINE = (n = 1) => { y += 6 * n; };

  // Header bar
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TN Automation', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional CCTV & Security Solutions', margin, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageW - margin, 12, { align: 'right' });
  y = 38;

  // Order meta
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order Number: ${order.orderNumber}`, margin, y);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW - margin, y, { align: 'right' });
  LINE();
  doc.text(`Payment: ${order.paymentMethod} — ${order.paymentStatus}`, margin, y);
  doc.text(`Status: ${order.orderStatus}`, pageW - margin, y, { align: 'right' });
  LINE(1.5);

  // Divider
  doc.setDrawColor(200, 210, 230);
  doc.line(margin, y, pageW - margin, y);
  LINE(1.5);

  // Bill to
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILL TO', margin, y);
  LINE();
  doc.setFont('helvetica', 'normal');
  const d = order.deliveryInfo;
  if (d) {
    doc.text(`${d.firstName} ${d.lastName}`, margin, y); LINE();
    doc.text(`${d.street}, ${d.city}, ${d.state} ${d.zip}`, margin, y); LINE();
    if (d.phone) { doc.text(`Phone: ${d.phone}`, margin, y); LINE(); }
    if (d.email) { doc.text(`Email: ${d.email}`, margin, y); LINE(); }
  }
  LINE(0.5);
  doc.line(margin, y, pageW - margin, y);
  LINE(1.5);

  // Items table header
  const colX = { desc: margin, qty: 102, unitPrice: 130, total: pageW - margin };
  doc.setFillColor(240, 245, 255);
  doc.rect(margin, y - 4, pageW - margin * 2, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Item', colX.desc, y + 2);
  doc.text('Qty', colX.qty, y + 2);
  doc.text('Unit Price', colX.unitPrice, y + 2);
  doc.text('Total', colX.total, y + 2, { align: 'right' });
  LINE(1.5);
  doc.setDrawColor(200, 210, 230);
  doc.line(margin, y, pageW - margin, y);
  LINE();

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const p of order.products) {
    const rowTotal = (p.productPrice * p.quantity).toFixed(2);
    doc.text(p.productName, colX.desc, y, { maxWidth: 70 });
    doc.text(String(p.quantity), colX.qty, y);
    doc.text(`$${p.productPrice.toFixed(2)}`, colX.unitPrice, y);
    doc.text(`$${rowTotal}`, colX.total, y, { align: 'right' });
    const lines = doc.splitTextToSize(p.productName, 70).length;
    y += Math.max(6, lines * 5.5);
    doc.setDrawColor(230, 235, 245);
    doc.line(margin, y - 1, pageW - margin, y - 1);
  }

  LINE(0.5);
  doc.setDrawColor(180, 195, 220);
  doc.line(margin, y, pageW - margin, y);
  LINE(1.2);

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL AMOUNT:', margin, y);
  doc.setTextColor(37, 99, 235);
  doc.text(`$${order.totalAmount.toFixed(2)}`, pageW - margin, y, { align: 'right' });

  // Footer
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 140, 160);
  doc.text('Thank you for choosing TN Automation • www.tnautomation.com • info@tnautomation.com', pageW / 2, y, { align: 'center' });

  doc.save(`Invoice-${order.orderNumber}.pdf`);
}

export default function UserOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    phone: '', street: '', city: '', state: '', zip: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setDeletingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'PUT' });
      if (res.ok) {
        const stored = localStorage.getItem('user');
        if (stored) fetchOrders(JSON.parse(stored).email);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel order');
      }
    } catch {
      alert('Failed to cancel order');
    } finally {
      setDeletingId(null);
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
                      <p className="text-muted-foreground mt-2">
                        Delivery Distance:{' '}
                        <span className="font-medium text-foreground">
                          {Number(order.distance || 0).toFixed(2)} km
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Delivery Charge:{' '}
                        <span className="font-medium text-foreground">
                          ₹{Number(order.deliveryCharge || 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Order Tracking Timeline */}
                  <OrderTimeline status={order.orderStatus} />

                  {/* Invoice download — always visible */}
                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2 items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => downloadInvoice(order)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Invoice
                    </Button>
                  </div>

                  {/* Edit / Cancel — visible only when status is Pending or Shipped */}
                  {canEdit(order) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {editOrderId !== order._id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEdit(order)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Order
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={deletingId === order._id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingId === order._id ? 'Cancelling…' : 'Cancel Order'}
                          </Button>
                        </div>
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
                  {/* Cancelled banner */}
                  {order.orderStatus?.toLowerCase() === 'cancelled' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3">
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                        <p className="text-sm font-medium text-red-700">Order Cancelled</p>
                      </div>
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
