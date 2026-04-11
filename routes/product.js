const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// GET /api/products
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

module.exports = router;
