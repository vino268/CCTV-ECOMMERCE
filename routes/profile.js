const express = require("express");
const { authenticate } = require("./auth");

const router = express.Router();

async function loadUserModel() {
  const { default: User } = await import("../models/User.js");
  return User;
}

async function loadAdminModel() {
  const { default: Admin } = await import("../models/Admin.js");
  return Admin;
}

function getTargetModel(role) {
  return String(role || "user").toLowerCase() === "admin" ? loadAdminModel : loadUserModel;
}

async function persistProfileImage(req, nextProfileImage) {
  const ModelLoader = getTargetModel(req.user?.role);
  const Model = await ModelLoader();
  const actor = await Model.findById(req.user.id);

  if (!actor) {
    return null;
  }

  actor.profileImage = nextProfileImage;
  if (Object.prototype.hasOwnProperty.call(actor.toObject ? actor.toObject() : actor, "avatar")) {
    actor.avatar = nextProfileImage;
  }
  await actor.save();

  return actor;
}


router.delete("/image", authenticate, async (req, res) => {
  try {
    const ModelLoader = getTargetModel(req.user?.role);
    const Model = await ModelLoader();
    const actor = await Model.findById(req.user.id);

    if (!actor) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    actor.profileImage = "";
    if (Object.prototype.hasOwnProperty.call(actor.toObject ? actor.toObject() : actor, "avatar")) {
      actor.avatar = "";
    }
    await actor.save();

    return res.status(200).json({ success: true, profileImage: "", avatar: "" });
  } catch (error) {
    console.error("DELETE /api/profile/image error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to remove profile image" });
  }
});

module.exports = router;

module.exports = router;