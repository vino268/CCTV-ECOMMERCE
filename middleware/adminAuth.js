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

module.exports = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (String(decoded?.role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    req.admin = decoded;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
