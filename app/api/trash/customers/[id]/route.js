import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
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
    const deletedCustomer = await User.findByIdAndDelete(id);
    if (!deletedCustomer) return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });

    const adminRec = await Admin.findById(auth.adminId).select('name').catch(() => null);
    await AdminLog.create({ adminName: adminRec?.name || String(auth.adminId), type: 'trash', action: 'customer_permanent_delete', message: `Customer permanently deleted: ${deletedCustomer._id}`, details: String(deletedCustomer._id) });

    return NextResponse.json({ success: true, message: 'Customer permanently deleted' });
  } catch (error) {
    console.error('DELETE /api/trash/customers/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Failed to permanently delete customer' }, { status: 500 });
  }
}
