import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAdmin, adminAuthError } from '@/app/api/admin/_helpers';

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const customers = await User.find({ isDeleted: true })
      .sort({ deletedAt: -1, updatedAt: -1 })
      .select('name email deletedAt createdAt');

    return NextResponse.json(customers);
  } catch (error) {
    console.error('GET /api/trash/customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted customers' }, { status: 500 });
  }
}
