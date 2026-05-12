import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import AdminLog from '@/models/AdminLog';
import Admin from '@/models/Admin';
import { verifyAdmin, adminAuthError } from '@/app/api/admin/_helpers';

export async function POST(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const id = params.id;
    const doc = await Order.findById(id);
    if (!doc) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    doc.isDeleted = false;
    doc.deletedAt = null;
    await doc.save();

    const adminRec = await Admin.findById(auth.adminId).select('name').catch(() => null);
    await AdminLog.create({ adminName: adminRec?.name || String(auth.adminId), type: 'trash', action: 'order_restore', message: `Order restored: ${doc._id}`, details: String(doc._id) });

    return NextResponse.json({ success: true, message: 'Order restored', order: doc });
  } catch (error) {
    console.error('POST /api/trash/orders/[id]/restore error:', error);
    return NextResponse.json({ success: false, message: 'Failed to restore order' }, { status: 500 });
  }
}
