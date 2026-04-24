const jwt = require("jsonwebtoken");

function parseCookieValue(cookieHeader, name) {
  if (!cookieHeader) return "";
  const parts = String(cookieHeader).split(";");
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (String(key || "").trim() === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return "";
}

module.exports = (req, res, next) => {
  const authHeader = String(req.headers.authorization || "").trim();
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const cookieToken = parseCookieValue(req.headers.cookie || "", "adminToken");
  const token = bearerToken || cookieToken;

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
