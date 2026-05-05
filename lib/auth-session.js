import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_NAMES = {
  admin: "admin_session",
  user: "user_session",
};

export function getSessionCookieName(role) {
  return role === "admin" ? SESSION_COOKIE_NAMES.admin : SESSION_COOKIE_NAMES.user;
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function getClearSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    expires: new Date(0),
  };
}

/**
 * Creates a new session in the database and returns the sessionId.
 * Note: This does NOT set the cookie. The caller (API route) must set the cookie.
 */
export async function createAuthSession({ userId, role, email = "" }) {
  await connectDB();

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await Session.create({
    userId,
    role,
    email: String(email || ""),
    token,
    expiresAt,
  });

  console.log(`[auth-session] Created ${role} session for userId=${userId}`);

  return { token, expiresAt };
}

/**
 * Verifies the session from the cookies.
 * Supports both verifyAuthSession(request, role) and verifyAuthSession(role).
 * In Middleware, you MUST pass the request object.
 */
export async function verifyAuthSession(requestOrRole, optionalRole) {
  let role = optionalRole || (typeof requestOrRole === "string" ? requestOrRole : null);
  const request = typeof requestOrRole === "object" ? requestOrRole : null;

  let token = "";

  if (request?.cookies) {
    if (role) {
      token = request.cookies.get?.(getSessionCookieName(role))?.value || request.cookies[getSessionCookieName(role)];
    } else {
      token = request.cookies.get?.(SESSION_COOKIE_NAMES.admin)?.value || 
              request.cookies.get?.(SESSION_COOKIE_NAMES.user)?.value ||
              request.cookies[SESSION_COOKIE_NAMES.admin] ||
              request.cookies[SESSION_COOKIE_NAMES.user];
    }
  } else {
    try {
      const cookieStore = await cookies();
      if (role) {
        token = cookieStore.get(getSessionCookieName(role))?.value;
      } else {
        token = cookieStore.get(SESSION_COOKIE_NAMES.admin)?.value || 
                cookieStore.get(SESSION_COOKIE_NAMES.user)?.value;
      }
    } catch (e) {
      console.error("[auth-session] cookies() not available and no request provided");
    }
  }

  console.log(`[auth-session] verifyAuthSession(${role || "any"}): token=${token ? token.slice(0, 8) + "..." : "EMPTY"}`);

  if (!token || token.length < 32) {
    return { ok: false, status: 401, message: "Unauthorized: Session missing or invalid" };
  }

  await connectDB();
  const session = await Session.findOne({
    token,
    ...(role ? { role } : {}),
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session) {
    console.log(`[auth-session] Session not found or expired for role: ${role || "any"}`);
    return { ok: false, status: 401, message: "Unauthorized: Session expired or invalid" };
  }

  // GLOBAL GUARD: Check if user is blocked
  if (session.role === "user") {
    const user = await User.findById(session.userId).select("isBlocked");
    if (!user || user.isBlocked) {
      console.log(`[auth-session] User ${session.userId} is blocked or not found. Destroying session.`);
      await Session.deleteOne({ token: session.token });
      return { 
        ok: false, 
        status: 403, 
        message: "Your account has been blocked by admin" 
      };
    }
  }

  return {
    ok: true,
    token,
    payload: {
      id: String(session.userId || ""),
      role: String(session.role || ""),
      email: String(session.email || ""),
    },
    session,
  };
}

/**
 * Revokes the session by deleting it from the database and clearing the cookie.
 */
export async function revokeAuthSession(role) {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName(role);
  const token = cookieStore.get(cookieName)?.value;

  if (token) {
    await connectDB();
    await Session.deleteOne({ token, role });
    console.log(`[auth-session] Revoked ${role} session`);
  }

  cookieStore.set(cookieName, "", getClearSessionCookieOptions());
  return true;
}