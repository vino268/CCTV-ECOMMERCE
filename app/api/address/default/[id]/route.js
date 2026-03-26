import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Address from "@/models/Address";
import { verifyUser, authError } from "../../_helpers";

// PUT /api/address/default/:id
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const auth = await verifyUser(request);
    if (!auth.ok) return authError(auth);

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Address ID is required" }, { status: 400 });
    }

    const address = await Address.findOne({ _id: id, userId: auth.userId });
    if (!address) {
      return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
    }

    await Address.updateMany({ userId: auth.userId }, { $set: { isDefault: false } });
    address.isDefault = true;
    await address.save();

    return NextResponse.json({ success: true, message: "Default address updated", address });
  } catch (error) {
    console.error("Set default address error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to set default address" },
      { status: 500 }
    );
  }
}
