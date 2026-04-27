import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import AdminLog from "@/models/AdminLog";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

function isValidObjectId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    console.log("Admin product delete route hit:", id);

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid product id" },
        { status: 400 }
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await Product.deleteOne({ _id: id });

    console.log("Admin product deleted successfully:", id);

    await AdminLog.create({
      adminName: "Admin",
      action: "Deleted product",
      details: product.name || String(product._id),
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete product",
      },
      { status: 500 }
    );
  }
}
