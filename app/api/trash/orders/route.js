import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyAdmin, adminAuthError } from '@/app/api/admin/_helpers';

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const orders = await Order.find({ isDeleted: true })
      .sort({ deletedAt: -1, updatedAt: -1 })
      .select('orderNumber customerName email totalAmount deletedAt createdAt');

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/trash/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted orders' }, { status: 500 });
  }
}
