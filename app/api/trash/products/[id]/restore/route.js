import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import AdminLog from '@/models/AdminLog';
import Admin from '@/models/Admin';
import { verifyAdmin, adminAuthError } from '@/app/api/admin/_helpers';

export async function POST(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const id = params.id;
    const doc = await Product.findById(id);
    if (!doc) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    doc.isDeleted = false;
    doc.deletedAt = null;
    await doc.save();

    const adminRec = await Admin.findById(auth.adminId).select('name').catch(() => null);
    await AdminLog.create({ adminName: adminRec?.name || String(auth.adminId), type: 'trash', action: 'product_restore', message: `Product restored: ${doc._id}`, details: String(doc._id) });

    return NextResponse.json({ success: true, message: 'Product restored', product: doc });
  } catch (error) {
    console.error('POST /api/trash/products/[id]/restore error:', error);
    return NextResponse.json({ success: false, message: 'Failed to restore product' }, { status: 500 });
  }
}
