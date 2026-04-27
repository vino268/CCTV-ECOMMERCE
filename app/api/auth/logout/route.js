import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    const cookieOptions = {
      path: "/",
    };

    response.cookies.delete("token", cookieOptions);
    response.cookies.delete("userToken", cookieOptions);

    return response;
  } catch (error) {
    console.error("Auth logout API error", error);
    return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 });
  }
}
