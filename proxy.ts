import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tnautomation.in", "https://www.tnautomation.in"] as const;
const ALLOWED_METHODS = "GET, POST, PUT, DELETE";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function applyNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function isAdminAuthPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout" ||
    pathname === "/api/admin/profile"
  );
}

function resolveAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number])) {
    return origin;
  }
  return ALLOWED_ORIGINS[1];
}

function buildCorsHeaders(request: NextRequest): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(request),
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function withCors(request: NextRequest, response: NextResponse, isApiRoute: boolean): NextResponse {
  if (isApiRoute) {
    Object.entries(buildCorsHeaders(request)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  if (isAdminAuthPath(request.nextUrl.pathname)) {
    applyNoCacheHeaders(response);
  }

  return response;
}

const PUBLIC_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: buildCorsHeaders(request),
    });
  }

  const isProtectedUserPage =
    pathname.startsWith("/account/orders") ||
    pathname.startsWith("/account/profile") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/checkout");

  const isProtectedUserApi =
    pathname.startsWith("/api/orders/user") || pathname.startsWith("/api/auth/profile");

  const isProtectedUserRoute = isProtectedUserPage || isProtectedUserApi;

  if (!pathname.startsWith("/admin") && !isProtectedUserRoute) {
    return withCors(request, NextResponse.next(), isApiRoute);
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return withCors(request, NextResponse.next(), isApiRoute);
  }

  if (pathname === "/admin") {
    return withCors(request, NextResponse.next(), isApiRoute);
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (isProtectedUserRoute) {
    const token = request.cookies.get("token")?.value || request.cookies.get("userToken")?.value;

    const requestedPath = `${pathname}${request.nextUrl.search || ""}`;
    const loginUrl = new URL(request.url);
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", requestedPath);

    if (!token || !jwtSecret) {
      if (isProtectedUserApi) {
        return withCors(
          request,
          NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
          isApiRoute
        );
      }

      return withCors(request, NextResponse.redirect(loginUrl), isApiRoute);
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);
      const email = String(payload.email || "").toLowerCase();
      const role = String(payload.role || "user").toLowerCase();

      if (!email || role !== "user") {
        throw new Error("Invalid user token payload");
      }

      let statusData: { blocked?: boolean } = { blocked: false };
      try {
        const statusUrl = new URL("/api/auth/block-status", request.url);
        statusUrl.searchParams.set("email", email);

        const statusRes = await fetch(statusUrl.toString(), {
          headers: {
            "x-internal-check": "proxy",
          },
        });

        statusData = await statusRes.json().catch(() => ({ blocked: false }));
      } catch {
        // Fail open for transient internal fetch issues to avoid navigation-time crashes.
        statusData = { blocked: false };
      }

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
          response.cookies.delete("token");
          response.cookies.delete("userToken");
          return withCors(request, response, isApiRoute);
        }

        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        response.cookies.delete("userToken");
        return withCors(request, response, isApiRoute);
      }

      return withCors(request, NextResponse.next(), isApiRoute);
    } catch {
      if (isProtectedUserApi) {
        const response = NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
        response.cookies.delete("token");
        response.cookies.delete("userToken");
        return withCors(request, response, isApiRoute);
      }

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      response.cookies.delete("userToken");
      return withCors(request, response, isApiRoute);
    }
  }

  const token = request.cookies.get("adminToken")?.value || request.cookies.get("admin_token")?.value || request.cookies.get("token")?.value;

  if (!token || !jwtSecret) {
    return withCors(request, NextResponse.redirect(new URL("/admin/login", request.url)), isApiRoute);
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    if (String(payload?.role || "") !== "admin") {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("token");
      response.cookies.delete("userToken");
      response.cookies.delete("adminToken");
      response.cookies.delete("admin_token");
      return withCors(request, response, isApiRoute);
    }

    return withCors(request, NextResponse.next(), isApiRoute);
  } catch {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("token");
    response.cookies.delete("userToken");
    response.cookies.delete("adminToken");
    response.cookies.delete("admin_token");
    return withCors(request, response, isApiRoute);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/account/orders/:path*",
    "/account/profile/:path*",
    "/wishlist/:path*",
    "/checkout/:path*",
    "/login",
    "/api/:path*",
  ],
};
