import User from "@/models/User";
import { verifyAuthSession } from "@/lib/auth-session";

export async function verifyWishlistUser(request) {
  const auth = await verifyAuthSession(request, "user");
  if (!auth.ok) {
    return auth;
  }

  const userId = String(auth.payload?.id || auth.payload?.userId || "");
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
}
