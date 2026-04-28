import { NextResponse } from "next/server";

export async function POST() {
  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  const secureCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    domain: isProduction ? ".tnautomation.in" : undefined,
    maxAge: 0,
    expires: new Date(0),
  };

  const cookieOptions = {
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    domain: isProduction ? ".tnautomation.in" : undefined,
    maxAge: 0,
    expires: new Date(0),
  };

  // Clear all admin tokens
  response.cookies.set("token", "", secureCookieOptions);
  response.cookies.set("adminToken", "", cookieOptions);
  response.cookies.set("userToken", "", cookieOptions);

  return response;
}
