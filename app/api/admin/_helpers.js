import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

function extractAdminToken(request) {
  return (
    request.cookies.get("adminToken")?.value ||
    request.cookies.get("admin_token")?.value ||
    request.cookies.get("token")?.value ||
    ""
  );
}

export async function verifyAdmin(request) {
  const token = extractAdminToken(request);
  if (!token) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "admin") {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    return {
      ok: true,
      adminId: String(payload.id || ""),
      role: String(payload.role || ""),
    };
  } catch {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
}

export function adminAuthError(auth) {
  return NextResponse.json(
    { success: false, message: auth.message },
    { status: auth.status }
  );
}
