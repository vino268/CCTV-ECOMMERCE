import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const sku = (searchParams.get('sku') || '').trim().toUpperCase();

    if (!sku) {
      return NextResponse.json({ exists: false });
    }

    const existing = await Product.findOne({
      sku: { $regex: new RegExp(`^${escapeRegExp(sku)}$`, 'i') },
    }).lean();

    return NextResponse.json({ exists: !!existing });
  } catch {
    return NextResponse.json({ error: 'Failed to check SKU' }, { status: 500 });
  }
}
