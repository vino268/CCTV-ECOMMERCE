import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtectedUserPage =
    pathname.startsWith("/account/orders") ||
    pathname.startsWith("/account/profile") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/checkout");

  const isProtectedUserApi =
    pathname.startsWith("/api/orders/user") ||
    pathname.startsWith("/api/auth/profile");

  const isProtectedUserRoute = isProtectedUserPage || isProtectedUserApi;

  // Only guard /admin routes
  if (!pathname.startsWith("/admin") && !isProtectedUserRoute) {
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

  if (isProtectedUserRoute) {
    const token = request.cookies.get("userToken")?.value;

    if (!token) {
      if (isProtectedUserApi) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }

      if (pathname.startsWith("/checkout")) {
        console.log("Middleware redirect to login for checkout", {
          pathname,
          hasUserToken: Boolean(token),
        });
        return NextResponse.redirect(new URL("/login?redirect=/checkout", request.url));
      }

      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const email = String(payload.email || "").toLowerCase();

      if (!email) {
        throw new Error("Invalid user token payload");
      }

      const statusUrl = new URL("/api/auth/block-status", request.url);
      statusUrl.searchParams.set("email", email);

      const statusRes = await fetch(statusUrl.toString(), {
        headers: {
          "x-internal-check": "middleware",
        },
      });

      const statusData = await statusRes.json().catch(() => ({ blocked: false }));

      if (statusData?.blocked) {
        if (isProtectedUserApi) {
          const response = NextResponse.json(
            {
              success: false,
              message: "User blocked",
              error: "Your account has been blocked. Please contact support.",
            },
            { status: 403 }
          );
          response.cookies.delete("userToken");
          return response;
        }

        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("userToken");
        return response;
      }

      return NextResponse.next();
    } catch {
      if (isProtectedUserApi) {
        const response = NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
        response.cookies.delete("userToken");
        return response;
      }

      if (pathname.startsWith("/checkout")) {
        console.log("Middleware invalid token redirect for checkout", {
          pathname,
        });
        const response = NextResponse.redirect(new URL("/login?redirect=/checkout", request.url));
        response.cookies.delete("userToken");
        return response;
      }

      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("userToken");
      return response;
    }
  }

  const token = request.cookies.get("adminToken")?.value;
  const userToken = request.cookies.get("userToken")?.value;

  if (!token) {
    if (userToken) {
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (String(payload?.role || "") !== "admin") {
      const response = NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
      response.cookies.delete("adminToken");
      return response;
    }

    return NextResponse.next();
  } catch {
    // Token invalid or expired — clear cookie and redirect
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("adminToken");
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/orders/:path*",
    "/account/profile/:path*",
    "/wishlist/:path*",
    "/checkout/:path*",
    "/api/orders/user",
    "/api/auth/profile",
  ],
};
