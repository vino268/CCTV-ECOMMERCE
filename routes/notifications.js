const express = require("express");
const Notification = require("../models/NotificationModel");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// GET /api/notifications
router.get("/", adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", adminAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, notification });
  } catch (error) {
    console.error("PUT /api/notifications/:id/read error:", error);
    return res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", adminAuth, async (_req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    return res.json({ success: true });
  } catch (error) {
    console.error("PUT /api/notifications/read-all error:", error);
    return res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
});

// DELETE /api/notifications
router.delete("/", adminAuth, async (_req, res) => {
  try {
    await Notification.deleteMany({});
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear notifications" });
  }
});

module.exports = router;
