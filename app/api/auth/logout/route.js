import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    };

    response.cookies.set("token", "", cookieOptions);
    response.cookies.set("userToken", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Auth logout API error", error);
    return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 });
  }
}
