const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createNotification = require("../utils/createNotification");

const router = express.Router();

function parseCookieValue(cookieHeader, name) {
  if (!cookieHeader) return "";
  const segments = String(cookieHeader).split(";");
  for (const segment of segments) {
    const [rawKey, ...rest] = segment.split("=");
    if (String(rawKey || "").trim() === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return "";
}

function getTokenFromRequest(req) {
  // Prefer parsed cookies from cookie-parser when available (req.cookies)
  try {
    const cookieToken = String(req.cookies?.token || req.cookies?.userToken || req.cookies?.adminToken || "").trim();
    if (cookieToken) return cookieToken;
  } catch (e) {
    // ignore and fallback to header parsing
  }

  const authHeader = String(req.headers.authorization || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = req.headers.cookie || "";
  return (
    parseCookieValue(cookieHeader, "token") ||
    parseCookieValue(cookieHeader, "userToken") ||
    parseCookieValue(cookieHeader, "adminToken")
  );
}

function authenticate(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: String(payload?.id || payload?.userId || ""),
      email: String(payload?.email || ""),
      role: String(payload?.role || "user"),
    };

    if (!req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

function requireAdmin(req, res, next) {
  if (String(req.user?.role || "").toLowerCase() !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  return next();
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const payload = req.body || {};
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const phone = String(payload.phone || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const { default: User } = await import("../models/User.js");
    const existing = await User.findOne({ email, isDeleted: { $ne: true } }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashed,
      role: "user",
    });

    await createNotification({
      title: "New User Registered",
      type: "user",
      message: `${name} created a new account`,
      userId: user._id,
    });

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const plainPassword = String(password || "");

    if (!normalizedEmail || !plainPassword) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const { default: User } = await import("../models/User.js");
    const user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const storedPassword = String(user.password || "");
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);

    let isPasswordMatch = false;
    if (isBcryptHash) {
      isPasswordMatch = await bcrypt.compare(plainPassword, storedPassword);
    } else {
      isPasswordMatch = plainPassword === storedPassword;
    }

    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!isBcryptHash) {
      user.password = await bcrypt.hash(plainPassword, 10);
      await user.save();
    }

    if (String(user.role || "").toLowerCase() === "admin") {
      return res.status(401).json({ success: false, message: "Admins must login from admin panel" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar || "",
      profileImage: user.profileImage || user.avatar || "",
      role: user.role,
    };

    const token = jwt.sign(
      {
        id: String(user._id),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieOptions = getCookieOptions();
    res.cookie("token", token, cookieOptions);
    res.cookie("userToken", token, cookieOptions);
    // Clear any admin token to avoid cross-role cookie collisions
    try {
        // Do not clear adminToken to preserve admin sessions
        // res.clearCookie("adminToken", clearOptions);
    } catch (e) {
      // ignore if clear fails
    }

    return res.json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const { default: User } = await import("../models/User.js");
    const user = await User.findById(req.user.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "User blocked" });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        profileImage: user.profileImage || user.avatar || "",
        role: user.role,
      },
    });
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  const { maxAge: _ignored, ...clearOptions } = getCookieOptions();
  res.clearCookie("token", clearOptions);
  res.clearCookie("userToken", clearOptions);
    // Do not clear adminToken to preserve admin sessions
    // res.clearCookie("adminToken", clearOptions);
  return res.json({ success: true });
});

module.exports = router;
module.exports.authenticate = authenticate;
module.exports.requireAdmin = requireAdmin;
