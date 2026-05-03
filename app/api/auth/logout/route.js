import { NextResponse } from "next/server";
import { revokeAuthSession } from "@/lib/auth-session";

export async function POST() {
  try {
    await revokeAuthSession("user").catch(() => null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth logout API error", error);
    return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 });
  }
}
