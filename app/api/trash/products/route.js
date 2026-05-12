import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyAdmin, adminAuthError } from '@/app/api/admin/_helpers';

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const products = await Product.find({ isDeleted: true })
      .sort({ deletedAt: -1, updatedAt: -1 })
      .select('name sku price image deletedAt createdAt');

    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/trash/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted products' }, { status: 500 });
  }
}
