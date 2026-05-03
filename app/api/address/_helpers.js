import { NextResponse } from "next/server";
import User from "@/models/User";
import { verifyAuthSession } from "@/lib/auth-session";

export async function verifyUser(request) {
  const auth = await verifyAuthSession(request, "user");
  if (!auth.ok) {
    return auth;
  }

  const tokenUserId = String(auth.payload?.id || auth.payload?.userId || "").trim();
  if (!tokenUserId) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const user = await User.findById(tokenUserId).select("_id email isBlocked isDeleted role");
  if (!user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  if (user.isDeleted) {
    return {
      ok: false,
      status: 403,
      message: "Your account has been deleted",
    };
  }

  if (user.isBlocked) {
    return {
      ok: false,
      status: 403,
      message: "Your account has been blocked. Please contact support.",
    };
  }

  if (String(user.role || "").toLowerCase() !== "user") {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return {
    ok: true,
    userId: String(user._id),
    email: String(user.email || auth.payload?.email || "").toLowerCase(),
  };
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
