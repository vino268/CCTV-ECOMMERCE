import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const orders = await Order.find({ isDeleted: true })
      .sort({ deletedAt: -1, updatedAt: -1 })
      .select("orderNumber customerName email totalAmount deletedAt createdAt");

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deleted orders" }, { status: 500 });
  }
}
