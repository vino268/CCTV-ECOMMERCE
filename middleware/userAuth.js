const jwt = require("jsonwebtoken");

function getUserToken(req) {
  try {
    const cookieToken = String(req.cookies?.userToken || req.cookies?.token || "").trim();
    if (cookieToken) return cookieToken;
  } catch (e) {
    // ignore
  }

  const authHeader = String(req.headers.authorization || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) return authHeader.slice(7).trim();

  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/(?:^|; )userToken=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return "";
}

module.exports = (req, res, next) => {
  const token = getUserToken(req);
  if (!token) return res.status(401).json({ message: "User not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: String(decoded?.id || decoded?.userId || ""),
      email: String(decoded?.email || ""),
      role: String(decoded?.role || "user"),
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
