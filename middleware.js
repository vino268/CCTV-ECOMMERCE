import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow public admin pages (login, forgot-password, etc.)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow the /admin root — it's a client-side redirect page
  if (pathname === "/admin") {
    return NextResponse.next();
  }

  const token = request.cookies.get("adminToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token invalid or expired — clear cookie and redirect
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("adminToken");
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
