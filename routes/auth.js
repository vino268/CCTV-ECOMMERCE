const express = require("express");
const bcrypt = require("bcryptjs");
const createNotification = require("../utils/createNotification");

const router = express.Router();

async function loadSessionAuth() {
  return import("../lib/auth-session.js");
}

async function authenticate(req, res, next) {
  try {
    const { verifyAuthSession } = await loadSessionAuth();
    const auth = await verifyAuthSession(req, "user");

    if (!auth.ok) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = String(auth.payload?.id || auth.payload?.userId || "");
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = {
      id: userId,
      email: String(auth.payload?.email || ""),
      role: String(auth.payload?.role || "user"),
    };

    return next();
  } catch (error) {
    console.error("authenticate error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

function requireAdmin(req, res, next) {
  if (String(req.user?.role || "").toLowerCase() !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  return next();
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

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar || "",
      profileImage: user.profileImage || user.avatar || "",
      role: user.role,
    };

    const { createAuthSession, getSessionCookieName, getSessionCookieOptions } = await loadSessionAuth();
    const { token } = await createAuthSession({
      userId: user._id,
      role: "user",
      email: user.email,
    });

    res.cookie(getSessionCookieName("user"), token, getSessionCookieOptions("user"));

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
router.post("/logout", async (req, res) => {
  try {
    const { revokeAuthSession, getClearSessionCookieOptions, getSessionCookieName } = await loadSessionAuth();
    await revokeAuthSession(req, "user").catch(() => null);
    res.cookie(getSessionCookieName("user"), "", getClearSessionCookieOptions("user"));
    return res.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

module.exports = router;
module.exports.authenticate = authenticate;
module.exports.requireAdmin = requireAdmin;
