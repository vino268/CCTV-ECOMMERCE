import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import User from "@/models/User";

export async function verifyUser(request) {
  const token = request.cookies.get("userToken")?.value;
  if (!token) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);

    if (!payload?.userId || payload?.role !== "user") {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    const user = await User.findById(String(payload.userId)).select("_id isBlocked");
    if (!user) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    if (user.isBlocked) {
      return {
        ok: false,
        status: 403,
        message: "Your account has been blocked. Please contact support.",
      };
    }

    return { ok: true, userId: String(user._id) };
  } catch {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
}

export function validateAddressPayload(payload) {
  const fullName = String(payload.fullName || payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const address = String(payload.address || "").trim();
  const city = String(payload.city || "").trim();
  const state = String(payload.state || "").trim();
  const pincode = String(payload.pincode || "").trim();

  if (!fullName || !phone || !address || !city || !state || !pincode) {
    return { ok: false, message: "All fields are required" };
  }

  if (!/^\d{10}$/.test(phone)) {
    return { ok: false, message: "Phone number must be 10 digits" };
  }

  if (!/^\d{6}$/.test(pincode)) {
    return { ok: false, message: "Pincode must be 6 digits" };
  }

  return {
    ok: true,
    data: {
      fullName,
      phone,
      address,
      city,
      state,
      pincode,
    },
  };
}

export function authError(auth) {
  return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
}
