const express = require("express");
const { authenticate } = require("./auth");

const router = express.Router();

async function loadUserModel() {
  const { default: User } = await import("../models/User.js");
  return User;
}

function mapUser(user) {
  return {
    _id: user?._id,
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    profileImage: user?.profileImage || user?.avatar || "",
    dob: user?.dob || null,
    address: user?.address || "",
    role: user?.role || "user",
    createdAt: user?.createdAt || null,
  };
}

// GET /api/users/profile and /api/user/profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const User = await loadUserModel();
    const user = await User.findById(req.user.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "User blocked" });
    }

    return res.status(200).json(mapUser(user));
  } catch (error) {
    console.error("GET /api/users/profile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/users/profile and /api/user/profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const User = await loadUserModel();
    const updates = req.body || {};

    const user = await User.findById(req.user.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (typeof updates.name === "string") user.name = updates.name.trim();
    if (typeof updates.phone === "string") user.phone = updates.phone.trim();
    if (typeof updates.address === "string") user.address = updates.address.trim();
    if (typeof updates.avatar === "string") user.avatar = updates.avatar.trim();
    if (typeof updates.profileImage === "string") user.profileImage = updates.profileImage.trim();

    if (typeof updates.dob === "string" && updates.dob.trim()) {
      const parsedDob = new Date(updates.dob);
      if (!Number.isNaN(parsedDob.getTime())) {
        user.dob = parsedDob;
      }
    } else if (updates.dob === null) {
      user.dob = null;
    }

    await user.save();

    return res.status(200).json(mapUser(user));
  } catch (error) {
    console.error("PUT /api/users/profile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
