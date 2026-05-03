import { NextResponse } from "next/server";
import { revokeAuthSession } from "@/lib/auth-session";

export async function POST() {
  await revokeAuthSession("admin").catch(() => null);

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
