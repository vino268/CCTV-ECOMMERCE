const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  try {
    const token = String(req.cookies?.adminToken || "").trim();

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (String(decoded?.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    req.admin = {
      id: decoded.id,
      role: decoded.role,
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
