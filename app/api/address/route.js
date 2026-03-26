import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Address from "@/models/Address";
import { verifyUser, authError, validateAddressPayload } from "./_helpers";

// POST /api/address
export async function POST(request) {
  try {
    await connectDB();

    const auth = await verifyUser(request);
    if (!auth.ok) return authError(auth);

    const body = await request.json();
    const valid = validateAddressPayload(body);
    if (!valid.ok) {
      return NextResponse.json({ success: false, message: valid.message }, { status: 400 });
    }

    const hasAnyAddress = await Address.exists({ userId: auth.userId });
    const shouldBeDefault = Boolean(body.isDefault) || !hasAnyAddress;

    if (shouldBeDefault) {
      await Address.updateMany({ userId: auth.userId }, { $set: { isDefault: false } });
    }

    const address = await Address.create({
      userId: auth.userId,
      ...valid.data,
      isDefault: shouldBeDefault,
    });

    return NextResponse.json({ success: true, message: "Address added", address });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add address" },
      { status: 500 }
    );
  }
}
