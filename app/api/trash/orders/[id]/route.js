import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import AdminLog from '@/models/AdminLog';
import Admin from '@/models/Admin';
import { verifyAdmin, adminAuthError } from '@/app/api/admin/_helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const id = params.id;
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const adminRec = await Admin.findById(auth.adminId).select('name').catch(() => null);
    await AdminLog.create({ adminName: adminRec?.name || String(auth.adminId), type: 'trash', action: 'order_permanent_delete', message: `Order permanently deleted: ${deletedOrder._id}`, details: String(deletedOrder._id) });

    return NextResponse.json({ success: true, message: 'Order permanently deleted' });
  } catch (error) {
    console.error('DELETE /api/trash/orders/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Failed to permanently delete order' }, { status: 500 });
  }
}
