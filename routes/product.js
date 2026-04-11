const express = require("express");

const router = express.Router();

// GET /api/products
router.get("/", (_req, res) => {
  try {
    const products = [
      {
        _id: "demo-1",
        name: "4MP Dome CCTV Camera",
        price: 2499,
        image: "https://via.placeholder.com/400x300?text=CCTV+Camera",
        category: "Camera",
      },
      {
        _id: "demo-2",
        name: "8 Channel DVR Recorder",
        price: 5999,
        image: "https://via.placeholder.com/400x300?text=DVR",
        category: "Recorder",
      },
      {
        _id: "demo-3",
        name: "2TB Surveillance Hard Disk",
        price: 3799,
        image: "https://via.placeholder.com/400x300?text=HDD",
        category: "Storage",
      },
    ];

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
