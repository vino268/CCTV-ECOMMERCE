const jwt = require("jsonwebtoken");

function getTokenFromRequest(req) {
  // Prefer explicit adminToken cookie, fall back to generic token header/cookie
  try {
    const cookieToken = String(req.cookies?.adminToken || req.cookies?.token || "").trim();
    if (cookieToken) return cookieToken;
  } catch (e) {
    // ignore and fallback
  }

  const authHeader = String(req.headers.authorization || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  // fallback to parsing raw cookie header
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/(?:^|; )adminToken=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return "";
}

module.exports = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "Admin not logged in" });
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
