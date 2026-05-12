import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AdminLog from "@/models/AdminLog";
import { verifyAuthSession } from "@/lib/auth-session";
import { revokeAuthSession } from "@/lib/auth-session";

export async function POST() {
  try {
    await connectDB();
    const auth = await verifyAuthSession(undefined, "admin");
    if (auth?.ok) {
      const adminEmail = String(auth?.session?.email || "");
      await AdminLog.create({
        adminName: "Admin",
        type: "auth",
        action: "logout",
        message: "Admin logged out",
        details: adminEmail,
      });
    }
  } catch (error) {
    console.error("Admin logout activity log error:", error);
  }

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
