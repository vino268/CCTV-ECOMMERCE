import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set("adminToken", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    console.error("Admin logout API error", error);
    return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 });
  }
}
