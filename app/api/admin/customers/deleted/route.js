import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const customers = await User.find({ role: "user", isDeleted: true })
      .sort({ deletedAt: -1, updatedAt: -1 })
      .select("name email phone deletedAt createdAt");

    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deleted customers" }, { status: 500 });
  }
}
