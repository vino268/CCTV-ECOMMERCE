import { jwtVerify } from "jose";
import User from "@/models/User";

export async function verifyWishlistUser(request) {
  const cookieToken =
    request.cookies.get("userToken")?.value || request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  const token = cookieToken || bearerToken;
  if (!token) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    const userId = String(payload?.id || payload?.userId || "");

    if (!userId) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    const user = await User.findById(userId).select("_id isBlocked isDeleted role");
    if (!user || user.isDeleted) {
      return { ok: false, status: 401, message: "Unauthorized" };
    }

    if (user.isBlocked) {
      return {
        ok: false,
        status: 403,
        message: "Your account has been blocked. Please contact support.",
      };
    }

    if (String(user.role || "").toLowerCase() !== "user") {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    return { ok: true, userId: String(user._id) };
  } catch {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
}
