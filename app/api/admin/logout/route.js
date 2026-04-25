import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully"
  });

  // Clear all authentication cookies
  response.cookies.set("token", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  response.cookies.set("adminToken", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  response.cookies.set("userToken", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
