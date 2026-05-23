import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

function normalizePaymentMethod(value) {
  const method = String(value || 'COD').trim();
  const normalized = method.toLowerCase();
  if (/cod|cash[\s-\-]?on[\s-\-]?delivery/i.test(normalized)) return 'COD';
  if (/online|razorpay|upi|card|netbanking/i.test(normalized)) return 'Online';
  return method || 'COD';
}

// GET /api/orders/user/:email
export async function GET(_req, { params }) {
  try {
    await connectDB();
    const { email } = await params;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const orders = await Order.find({
      isDeleted: false,
      $or: [
        { email: normalizedEmail },
        { 'user.email': normalizedEmail },
      ],
    }).sort({ createdAt: -1 });

    const seen = new Set();
    const deduped = [];
    for (const order of orders) {
      const key = String(order?.orderId || order?._id || '').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push({
        ...order.toObject(),
        paymentMethod: normalizePaymentMethod(order.paymentMethod),
      });
    }

    return NextResponse.json(deduped, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('GET /api/orders/user/:email error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch user orders' }, { status: 500 });
  }
}
