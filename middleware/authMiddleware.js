const jwt = require("jsonwebtoken");

async function loadUserModel() {
  const { default: User } = await import("../models/User.js");
  return User;
}

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = await loadUserModel();
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "Token failed" });
    }

    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token failed" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(401).json({ message: "Admin only" });
};

module.exports = {
  protect,
  adminOnly,
};
