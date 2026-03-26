import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Address from "@/models/Address";
import { verifyUser, authError } from "../_helpers";

// GET /api/address/user
export async function GET(request) {
  try {
    await connectDB();

    const auth = await verifyUser(request);
    if (!auth.ok) return authError(auth);

    const addresses = await Address.find({ userId: auth.userId }).sort({ isDefault: -1, createdAt: -1 });
    const normalizedAddresses = addresses.map((item) => {
      const json = item.toObject();
      return {
        ...json,
        fullName: json.fullName || json.name || "",
      };
    });

    return NextResponse.json({ success: true, addresses: normalizedAddresses });
  } catch (error) {
    console.error("Get user addresses error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}
