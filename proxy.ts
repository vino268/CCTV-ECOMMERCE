import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthSession } from "@/lib/auth-session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const adminSession = req.cookies.get("admin_session")?.value;
    if (!adminSession && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protect user routes
  if (pathname.startsWith("/account")) {
    const userSession = req.cookies.get("user_session")?.value;
    if (!userSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // CRITICAL: Check if user is blocked
    const auth = await verifyAuthSession(req, "user");
    if (!auth.ok || auth.status === 403) {
      console.log(`[proxy] Access denied to ${pathname} for blocked or invalid user.`);
      const response = NextResponse.redirect(new URL("/login?blocked=1", req.url));
      // Clear invalid/blocked session cookie
      response.cookies.set("user_session", "", { expires: new Date(0), path: "/" });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
