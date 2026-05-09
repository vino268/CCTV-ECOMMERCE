const express = require("express");
const router = express.Router();
const cors = require("cors");
const cloudinary = require("../lib/cloudinary");

router.options("/", cors());

router.post("/", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "No image provided",
      });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: "products",
    });

    res.json({
      success: true,
      url: result.secure_url,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
