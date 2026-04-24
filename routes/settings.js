const express = require("express");
const Settings = require("../models/Settings");
const { protectAdmin } = require("../middleware/auth");

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

router.get("/", async (_req, res) => {
  try {
    const settings = await Settings.findOne().sort({ updatedAt: -1 }).lean();

    const payload = settings
      ? {
          ...settings,
          phone: String(settings.phone || "").trim(),
          email: String(settings.email || "").trim(),
          address: String(settings.address || "").trim(),
          businessHours: normalizeBusinessHours(settings.businessHours),
          contact: {
            phone: String(settings.phone || "").trim(),
            email: String(settings.email || "").trim(),
            address: String(settings.address || "").trim(),
          },
        }
      : {
          phone: "",
          email: "",
          address: "",
          businessHours: normalizeBusinessHours({}),
          contact: { phone: "", email: "", address: "" },
        };

    return res.status(200).json({
      success: true,
      data: payload,
      ...payload,
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      data: {},
    });
  }
});

router.post("/", protectAdmin, async (req, res) => {
  try {
    const payload = req.body || {};

    const nextData = {
      siteName: String(payload.siteName || payload.storeName || "").trim(),
      email: String(payload.email || payload.contact?.email || "").trim(),
      phone: String(payload.phone || payload.contact?.phone || "").trim(),
      address: String(payload.address || payload.contact?.address || "").trim(),
      businessHours:
        payload.businessHours && typeof payload.businessHours === "object"
          ? normalizeBusinessHours(payload.businessHours)
          : null,
    };

    const existing = await Settings.findOne().sort({ updatedAt: -1 });

    let settings;
    if (existing) {
      existing.siteName = nextData.siteName;
      existing.email = nextData.email;
      existing.phone = nextData.phone;
      existing.address = nextData.address;
      if (nextData.businessHours) {
        existing.businessHours = nextData.businessHours;
      }
      settings = await existing.save();
    } else {
      settings = await Settings.create({
        ...nextData,
        businessHours: nextData.businessHours || normalizeBusinessHours({}),
      });
    }

    const responseData = {
      ...(settings.toObject ? settings.toObject() : settings),
      businessHours: normalizeBusinessHours(settings.businessHours),
      contact: {
        phone: String(settings.phone || "").trim(),
        email: String(settings.email || "").trim(),
        address: String(settings.address || "").trim(),
      },
    };

    return res.status(200).json({ success: true, data: responseData, ...responseData });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return res.status(500).json({ success: false, message: "Failed to save settings" });
  }
});

module.exports = router;
