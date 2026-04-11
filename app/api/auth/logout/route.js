import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("userToken", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("Auth logout API error", error);
    return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 });
  }
}
