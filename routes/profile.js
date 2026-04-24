const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
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

function normalizeUploadPath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function getExistingImagePath(profileImage) {
  const value = String(profileImage || "").trim();
  if (!value.startsWith("/uploads/profile/")) return null;
  return path.join(process.cwd(), value.replace(/^\//, ""));
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "profile");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(String(file.originalname || "")).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png"].includes(ext) ? ext : ".jpg";
    const actorId = String(req.user?.id || "profile").replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${actorId}-${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|jpg)$/.test(String(file.mimetype || "").toLowerCase())) {
      cb(new Error("Only JPG and PNG images are allowed"));
      return;
    }

    cb(null, true);
  },
});

async function persistProfileImage(req, nextProfileImage) {
  const ModelLoader = getTargetModel(req.user?.role);
  const Model = await ModelLoader();
  const actor = await Model.findById(req.user.id);

  if (!actor) {
    return null;
  }

  const previousImage = String(actor.profileImage || actor.avatar || "").trim();
  actor.profileImage = nextProfileImage;
  if (Object.prototype.hasOwnProperty.call(actor.toObject ? actor.toObject() : actor, "avatar")) {
    actor.avatar = nextProfileImage;
  }
  await actor.save();

  const previousPath = getExistingImagePath(previousImage);
  const nextPath = getExistingImagePath(nextProfileImage);
  if (previousPath && previousPath !== nextPath && fs.existsSync(previousPath)) {
    try {
      fs.unlinkSync(previousPath);
    } catch {
      // Ignore cleanup errors.
    }
  }

  return actor;
}

router.put("/image", authenticate, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Profile image is required" });
    }

    const normalizedFilePath = normalizeUploadPath(req.file.path);
    const fileName = path.basename(normalizedFilePath);
    const ext = path.extname(fileName).toLowerCase();
    const profileImage = normalizeUploadPath(`/uploads/profile/${fileName}`);
    const actor = await persistProfileImage(req, profileImage);

    if (!actor) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    return res.status(200).json({
      success: true,
      profileImage,
      avatar: profileImage,
      ext,
    });
  } catch (error) {
    console.error("PUT /api/profile/image error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to upload profile image" });
  }
});

router.delete("/image", authenticate, async (req, res) => {
  try {
    const ModelLoader = getTargetModel(req.user?.role);
    const Model = await ModelLoader();
    const actor = await Model.findById(req.user.id);

    if (!actor) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const previousImage = String(actor.profileImage || actor.avatar || "").trim();
    actor.profileImage = "";
    if (Object.prototype.hasOwnProperty.call(actor.toObject ? actor.toObject() : actor, "avatar")) {
      actor.avatar = "";
    }
    await actor.save();

    const previousPath = getExistingImagePath(previousImage);
    if (previousPath && fs.existsSync(previousPath)) {
      try {
        fs.unlinkSync(previousPath);
      } catch {
        // Ignore cleanup errors.
      }
    }

    return res.status(200).json({ success: true, profileImage: "", avatar: "" });
  } catch (error) {
    console.error("DELETE /api/profile/image error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to remove profile image" });
  }
});

module.exports = router;