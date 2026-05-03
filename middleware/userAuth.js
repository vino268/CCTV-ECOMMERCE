async function loadSessionAuth() {
  return import("../lib/auth-session.js");
}

async function loadUserModel() {
  const { default: User } = await import("../models/User.js");
  return User;
}

module.exports = async (req, res, next) => {
  try {
    const { verifyAuthSession } = await loadSessionAuth();
    const auth = await verifyAuthSession(req, "user");

    if (!auth.ok) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const userId = String(auth.payload?.id || auth.payload?.userId || "");
    if (!userId) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const User = await loadUserModel();
    const user = await User.findById(userId).select("-password");

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Invalid session" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "User blocked" });
    }

    req.user = {
      id: String(user._id),
      email: String(user.email || ""),
      role: String(user.role || "user"),
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
