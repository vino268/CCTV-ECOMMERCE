const express = require("express");
const mongoose = require("mongoose");
const Address = require("../models/AddressModel");
const { authenticate } = require("./auth");
const createNotification = require("../utils/createNotification");

const router = express.Router();

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toAddressPayload(body) {
  const fullName = trim(body?.fullName || body?.name);
  return {
    fullName,
    name: fullName,
    phone: trim(body?.phone),
    email: trim(body?.email),
    address: trim(body?.address),
    city: trim(body?.city),
    state: trim(body?.state),
    pincode: trim(body?.pincode),
    isDefault: Boolean(body?.isDefault),
  };
}

function isValidAddress(payload) {
  return Boolean(
    payload.fullName &&
      payload.phone &&
      payload.address &&
      payload.city &&
      payload.state &&
      payload.pincode
  );
}

// POST /api/address and /api/address/add
const createAddressHandler = async (req, res) => {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(String(req.user?.id || ""))
      ? new mongoose.Types.ObjectId(String(req.user.id))
      : null;

    if (!userObjectId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = toAddressPayload(req.body || {});
    if (!isValidAddress(payload)) {
      return res.status(400).json({ success: false, message: "All address fields are required" });
    }

    if (payload.isDefault) {
      await Address.updateMany({ user: userObjectId }, { $set: { isDefault: false } });
    }

    if (!payload.isDefault) {
      const hasAny = await Address.exists({ user: userObjectId });
      if (!hasAny) {
        payload.isDefault = true;
      }
    }

    const newAddress = new Address({
      user: userObjectId,
      ...payload,
    });

    await newAddress.save();

    await createNotification({
      title: "Address Updated",
      type: "address",
      message: `${trim(req.user?.email || "User")} added a delivery address`,
      userId: req.user?.id,
    });

    return res.json({ success: true, address: newAddress });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to save address" });
  }
};

router.post("/", authenticate, createAddressHandler);
router.post("/add", authenticate, createAddressHandler);

// GET /api/address/my
router.get("/my", authenticate, async (req, res) => {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(String(req.user?.id || ""))
      ? new mongoose.Types.ObjectId(String(req.user.id))
      : null;

    if (!userObjectId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const addresses = await Address.find({ user: userObjectId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    return res.status(200).json({ success: true, addresses: Array.isArray(addresses) ? addresses : [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load addresses" });
  }
});

// GET /api/address/user (legacy alias)
router.get("/user", authenticate, async (req, res) => {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(String(req.user?.id || ""))
      ? new mongoose.Types.ObjectId(String(req.user.id))
      : null;

    if (!userObjectId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const addresses = await Address.find({ user: userObjectId }).sort({ isDefault: -1, createdAt: -1 }).lean();
    return res.status(200).json({ success: true, addresses: Array.isArray(addresses) ? addresses : [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load addresses" });
  }
});

// PUT /api/address/:id
router.put("/:id", authenticate, async (req, res) => {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(String(req.user?.id || ""))
      ? new mongoose.Types.ObjectId(String(req.user.id))
      : null;

    if (!userObjectId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const current = await Address.findOne({ _id: req.params.id, user: userObjectId });
    if (!current) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const updates = {};
    const payload = toAddressPayload(req.body || {});

    if (payload.fullName) {
      updates.fullName = payload.fullName;
      updates.name = payload.fullName;
    }
    if (payload.phone) updates.phone = payload.phone;
    if (typeof req.body?.email === "string") updates.email = payload.email;
    if (payload.address) updates.address = payload.address;
    if (payload.city) updates.city = payload.city;
    if (payload.state) updates.state = payload.state;
    if (payload.pincode) updates.pincode = payload.pincode;

    if (req.body?.isDefault === true) {
      await Address.updateMany({ user: userObjectId }, { $set: { isDefault: false } });
      updates.isDefault = true;
    }

    const updated = await Address.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).lean();

    await createNotification({
      title: "Address Updated",
      type: "address",
      message: `${trim(req.user?.email || "User")} updated a delivery address`,
      userId: req.user?.id,
    });

    return res.status(200).json({ success: true, address: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update address" });
  }
});

// DELETE /api/address/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(String(req.user?.id || ""))
      ? new mongoose.Types.ObjectId(String(req.user.id))
      : null;

    if (!userObjectId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const target = await Address.findOne({ _id: req.params.id, user: userObjectId }).lean();
    if (!target) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    await Address.deleteOne({ _id: req.params.id, user: userObjectId });

    if (target.isDefault) {
      const next = await Address.findOne({ user: userObjectId }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete address" });
  }
});

module.exports = router;
