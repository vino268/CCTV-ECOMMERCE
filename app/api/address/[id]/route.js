import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Address from "@/models/Address";
import Notification from "@/models/Notification";
import { verifyUser, authError, validateAddressPayload } from "../_helpers";

// PUT /api/address/:id
export async function PUT(request, { params }) {
  try {
    await connectDB();

    const auth = await verifyUser(request);
    if (!auth.ok) return authError(auth);

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Address ID is required" }, { status: 400 });
    }

    const existing = await Address.findOne({ _id: id, userId: auth.userId });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    if (Object.keys(body).length === 1 && typeof body.isDefault !== "undefined") {
      const shouldBeDefault = Boolean(body.isDefault);
      if (shouldBeDefault) {
        await Address.updateMany({ userId: auth.userId }, { $set: { isDefault: false } });
      }
      existing.isDefault = shouldBeDefault;
      await existing.save();

      await Notification.create({
        title: "Address Updated",
        type: "address",
        message: shouldBeDefault ? "Default address was changed" : "Address was updated",
        userId: auth.userId,
        isRead: false,
      });

      return NextResponse.json({
        success: true,
        message: shouldBeDefault ? "Default address updated" : "Address updated",
        address: existing,
      });
    }

    const valid = validateAddressPayload(body);
    if (!valid.ok) {
      return NextResponse.json({ success: false, message: valid.message }, { status: 400 });
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

    await Notification.create({
      title: "Address Updated",
      type: "address",
      message: "Address details were updated",
      userId: auth.userId,
      isRead: false,
    });

    return NextResponse.json({ success: true, message: "Address updated", address: existing });
  } catch (error) {
    console.error("Update address by id error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE /api/address/:id
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const auth = await verifyUser(request);
    if (!auth.ok) return authError(auth);

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Address ID is required" }, { status: 400 });
    }

    const address = await Address.findOneAndDelete({ _id: id, userId: auth.userId });
    if (!address) {
      return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
    }

    if (address.isDefault) {
      const latest = await Address.findOne({ userId: auth.userId }).sort({ createdAt: -1 });
      if (latest) {
        latest.isDefault = true;
        await latest.save();
      }
    }

    return NextResponse.json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("Delete address by id error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete address" },
      { status: 500 }
    );
  }
}
