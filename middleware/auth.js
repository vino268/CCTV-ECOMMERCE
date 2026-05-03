async function loadSessionAuth() {
  return import("../lib/auth-session.js");
}

async function loadAdminModel() {
  const { default: Admin } = await import("../models/Admin.js");
  return Admin;
}

const verifyAdmin = async (req, res, next) => {
  try {
    const { verifyAuthSession } = await loadSessionAuth();
    const auth = await verifyAuthSession(req, "admin");

    if (!auth.ok) {
      return res.status(401).json({ message: "Invalid session" });
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

    if (String(admin.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    req.admin = {
      id: String(admin._id),
      role: String(admin.role || "admin"),
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const protectAdmin = verifyAdmin;

module.exports = {
  verifyAdmin,
  protectAdmin,
};
