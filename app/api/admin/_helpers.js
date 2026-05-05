import { NextResponse } from "next/server";
import { verifyAuthSession } from "@/lib/auth-session";

export async function verifyAdmin(req) {
  console.log("[verifyAdmin] Checking admin session...");

  const auth = await verifyAuthSession(req, "admin");

  console.log("[verifyAdmin] Auth result:", { ok: auth.ok, status: auth.status, message: auth.message });

  if (!auth.ok) {
    return auth;
  }

  return {
    ok: true,
    adminId: String(auth.payload?.id || ""),
    role: String(auth.payload?.role || ""),
  };
}

export function adminAuthError(auth) {
  return NextResponse.json(
    { success: false, message: auth.message },
    { status: auth.status }
  );
}
