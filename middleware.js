import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(response, isApiRoute) {
  if (isApiRoute) {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

const PUBLIC_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

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
    return withCors(NextResponse.next(), isApiRoute);
  }

  // Allow public admin pages (login, forgot-password, etc.)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return withCors(NextResponse.next(), isApiRoute);
  }

  // Allow the /admin root — it's a client-side redirect page
  if (pathname === "/admin") {
    return withCors(NextResponse.next(), isApiRoute);
  }

  if (isProtectedUserRoute) {
    const token = request.cookies.get("userToken")?.value;

    const requestedPath = `${pathname}${request.nextUrl.search || ""}`;
    const loginUrl = new URL(request.url);
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", requestedPath);

    if (!token) {
      if (isProtectedUserApi) {
        return withCors(NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        ), isApiRoute);
      }

      return withCors(NextResponse.redirect(loginUrl), isApiRoute);
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
          return withCors(response, isApiRoute);
        }

        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("userToken");
        return withCors(response, isApiRoute);
      }

      return withCors(NextResponse.next(), isApiRoute);
    } catch {
      if (isProtectedUserApi) {
        const response = NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
        response.cookies.delete("userToken");
        return withCors(response, isApiRoute);
      }

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("userToken");
      return withCors(response, isApiRoute);
    }
  }

  const token = request.cookies.get("adminToken")?.value;
  const userToken = request.cookies.get("userToken")?.value;

  if (!token) {
    if (userToken) {
      return withCors(NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url)), isApiRoute);
    }
    return withCors(NextResponse.redirect(new URL("/admin/login", request.url)), isApiRoute);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (String(payload?.role || "") !== "admin") {
      const response = NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
      response.cookies.delete("adminToken");
      return withCors(response, isApiRoute);
    }

    return withCors(NextResponse.next(), isApiRoute);
  } catch {
    // Token invalid or expired — clear cookie and redirect
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("adminToken");
    return withCors(response, isApiRoute);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/orders/:path*",
    "/account/profile/:path*",
    "/wishlist/:path*",
    "/checkout/:path*",
    "/api/:path*",
  ],
};
