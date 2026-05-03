async function loadSessionAuth() {
  return import("../lib/auth-session.js");
}

async function loadAdminModel() {
  const { default: Admin } = await import("../models/Admin.js");
  return Admin;
}

module.exports = async (req, res, next) => {
  try {
    const { verifyAuthSession } = await loadSessionAuth();
    const auth = await verifyAuthSession(req, "admin");

    if (!auth.ok) {
      return res.status(401).json({ message: "Admin not logged in" });
    }

    const adminId = String(auth.payload?.id || auth.payload?.userId || "");
    if (!adminId) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const Admin = await loadAdminModel();
    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid session" });
    }

    req.admin = {
      id: String(admin._id),
      email: String(admin.email || ""),
      role: String(admin.role || "admin"),
    };
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
