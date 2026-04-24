const express = require("express");
const ServiceModel = require("../models/ServiceModel");
const { protectAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const services = await ServiceModel.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
    const data = Array.isArray(services) ? services : [];

    console.log("Services:", data.length);

    return res.status(200).json(data);
  } catch (error) {
    console.error("GET /api/services error:", error);
    return res.status(500).json([]);
  }
});

router.post("/", protectAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    const title = String(payload.title || payload.name || "").trim();

    const service = await ServiceModel.create({
      title,
      name: title,
      description: String(payload.description || "").trim(),
      price: Number(payload.price || 0),
      isActive: payload.isActive !== false,
    });

    return res.status(201).json({ success: true, data: service });
  } catch (error) {
    console.error("POST /api/services error:", error);
    return res.status(500).json({ success: false, message: "Failed to create service" });
  }
});

router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    const title = String(payload.title || payload.name || "").trim();

    const service = await ServiceModel.findByIdAndUpdate(
      req.params.id,
      {
        title,
        name: title,
        description: String(payload.description || "").trim(),
        price: Number(payload.price || 0),
        ...(typeof payload.isActive === "boolean" ? { isActive: payload.isActive } : {}),
      },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    return res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.error("PUT /api/services/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to update service" });
  }
});

router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const service = await ServiceModel.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    return res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.error("DELETE /api/services/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete service" });
  }
});

module.exports = router;
