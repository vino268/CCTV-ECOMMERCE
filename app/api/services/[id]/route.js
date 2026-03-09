import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";

// PUT /api/services/[id] — update name, description and price
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();

    const allowed = {};
    if (data.name !== undefined) allowed.name = String(data.name).trim();
    if (data.description !== undefined)
      allowed.description = String(data.description).trim();
    if (data.price !== undefined) allowed.price = Number(data.price);

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json(
        { error: "No editable fields provided" },
        { status: 400 }
      );
    }

    if (allowed.name === "") {
      return NextResponse.json(
        { error: "Service name cannot be empty" },
        { status: 400 }
      );
    }

    const service = await Service.findByIdAndUpdate(id, allowed, {
      new: true,
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] — delete a service
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete service", message: error.message },
      { status: 500 }
    );
  }
}
