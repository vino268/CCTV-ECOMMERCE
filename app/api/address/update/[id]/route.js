import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Address from "@/models/Address";
import { verifyUser, authError, validateAddressPayload } from "../../_helpers";

// PUT /api/address/update/:id
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const auth = await verifyUser(request);
    if (!auth.ok) return authError(auth);

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Address ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const valid = validateAddressPayload(body);
    if (!valid.ok) {
      return NextResponse.json({ success: false, message: valid.message }, { status: 400 });
    }

    const existing = await Address.findOne({ _id: id, userId: auth.userId });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
    }

    const setDefault = Boolean(body.isDefault);
    if (setDefault) {
      await Address.updateMany({ userId: auth.userId }, { $set: { isDefault: false } });
    }

    existing.fullName = valid.data.fullName;
    existing.phone = valid.data.phone;
    existing.address = valid.data.address;
    existing.city = valid.data.city;
    existing.state = valid.data.state;
    existing.pincode = valid.data.pincode;
    existing.isDefault = setDefault || existing.isDefault;

    await existing.save();

    return NextResponse.json({ success: true, message: "Address updated", address: existing });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update address" },
      { status: 500 }
    );
  }
}
