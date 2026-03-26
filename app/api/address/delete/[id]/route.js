import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Address from "@/models/Address";
import { verifyUser, authError } from "../../_helpers";

// DELETE /api/address/delete/:id
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
    console.error("Delete address error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete address" },
      { status: 500 }
    );
  }
}
