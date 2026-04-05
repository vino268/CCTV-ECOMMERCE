import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ConnectDB();
    const { id } = await params;
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ConnectDB();
    const { id } = await params;
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const normalizedName = name.trim();
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });

    if (duplicate) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const updated = await Category.findByIdAndUpdate(id, { name: normalizedName }, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}
