import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.isDeleted) {
      return NextResponse.json({ error: "Only deleted products can be permanently deleted" }, { status: 400 });
    }

    await Product.findByIdAndDelete(id);

    await AdminLog.create({
      adminName: "Admin",
      action: "Permanently deleted product",
      details: product.name || String(product._id),
    });

    return NextResponse.json({ success: true, message: "Product permanently deleted" });
  } catch (error) {
    console.error("Failed to permanently delete product:", error);
    return NextResponse.json({ error: "Failed to permanently delete product" }, { status: 500 });
  }
}
