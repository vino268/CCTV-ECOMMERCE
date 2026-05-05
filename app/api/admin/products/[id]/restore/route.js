import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: true },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: "Deleted product not found" }, { status: 404 });
    }

    await AdminLog.create({
      adminName: "Admin",
      action: "Restored product",
      details: product.name || String(product._id),
    });

    return NextResponse.json({ success: true, message: "Product restored successfully", product });
  } catch (error) {
    console.error("Failed to restore product:", error);
    return NextResponse.json({ error: "Failed to restore product" }, { status: 500 });
  }
}
