import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import { verifyAuthSession } from "@/lib/auth-session";

export async function PUT(req, { params }) {
  try {
    const auth = await verifyAuthSession(req, "admin");
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ message: "Name required" }, { status: 400 });
    }

    await connectDB();
    const normalizedName = name.trim();
    
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") }
    });

    if (duplicate) {
      return NextResponse.json({ message: "Category name already exists" }, { status: 400 });
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { name: normalizedName },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("PUT /api/admin/categories/[id] error:", error);
    return NextResponse.json({ message: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAuthSession(req, "admin");
    if (!auth.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error:", error);
    return NextResponse.json({ message: "Failed to delete category" }, { status: 500 });
  }
}
