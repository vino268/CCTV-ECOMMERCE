const jwt = require("jsonwebtoken");

function getTokenFromRequest(req) {
  const cookieToken = String(req.cookies?.token || req.cookies?.adminToken || "").trim();
  if (cookieToken) return cookieToken;

  const authHeader = String(req.headers.authorization || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return "";
}

const verifyAdmin = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

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
