const express = require("express");
const mongoose = require("mongoose");
const Settings = require("../models/Settings");

const router = express.Router();

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function normalizeBusinessHours(input = {}) {
  const source = input && typeof input === "object" ? input : {};

  return DAY_KEYS.reduce((acc, day) => {
    acc[day] = String(source[day] || "").trim();
    return acc;
  }, {});
}

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    collection: "contact_messages",
  }
);

const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", ContactMessageSchema);

// GET /api/contact
router.get("/contact", async (_req, res) => {
  try {
    const settings = await Settings.findOne().sort({ updatedAt: -1 }).lean();

    const contact = settings
      ? {
          phone: String(settings.phone || "").trim(),
          email: String(settings.email || "").trim(),
          address: String(settings.address || "").trim(),
          businessHours: normalizeBusinessHours(settings.businessHours),
        }
      : null;

    return res.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error("GET /api/contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching contact",
    });
  }
});

// POST /api/contact
router.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required",
      });
    }

    await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || "").trim(),
      subject: String(subject || "").trim(),
      message: String(message).trim(),
    });

    return res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
});

module.exports = router;
