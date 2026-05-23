export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const deletedProduct = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    console.log("Admin product moved to trash successfully:", id);

    await AdminLog.create({
      adminName: "Admin",
      action: "Deleted product",
      details: deletedProduct.name || String(deletedProduct._id),
    });

    return NextResponse.json({
      success: true,
      message: "Product moved to trash successfully",
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
