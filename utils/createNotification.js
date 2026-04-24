const mongoose = require("mongoose");
const Notification = require("../models/NotificationModel");

function toObjectId(value) {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(raw)) return undefined;
  return new mongoose.Types.ObjectId(raw);
}

async function createNotification({ title, message, type = "system", userId, orderId, isRead = false }) {
  try {
    await Notification.create({
      title: String(title || "Notification").trim(),
      message: String(message || "").trim(),
      type: String(type || "system").trim(),
      userId: toObjectId(userId),
      orderId: toObjectId(orderId),
      isRead: Boolean(isRead),
    });
  } catch (error) {
    console.error("Notification error:", error);
  }
}

module.exports = createNotification;
