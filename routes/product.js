const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const createNotification = require("../utils/createNotification");

const router = express.Router();

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeOriginalName = String(file.originalname || "image")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, `${Date.now()}-${safeOriginalName}`);
  },
});

const upload = multer({ storage: uploadStorage });

// GET /api/products/latest
router.get("/latest", async (req, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit || 8));
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name sku slug price image images category inStock createdAt updatedAt")
      .lean();

    return res.status(200).json({
      success: true,
      products: Array.isArray(products) ? products : [],
    });
  } catch (error) {
    console.error("GET /api/products/latest error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load latest products",
      products: [],
    });
  }
});

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const exclude = String(req.query.exclude || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 50));

    const query = {};
    if (category && category !== "All Categories") {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (exclude) {
      query._id = { $ne: exclude };
    }

    const [totalProducts, filteredProductsCount] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments(query),
    ]);
    const totalPages = Math.max(1, Math.ceil(filteredProductsCount / limit));

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name sku slug price image images features category inStock createdAt updatedAt")
      .lean();

    const safeProducts = Array.isArray(products) ? products : [];

    console.log("Products:", safeProducts.length);

    return res.status(200).json({
      success: true,
      products: safeProducts,
      totalProducts,
      filteredProductsCount,
      total: filteredProductsCount,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load products",
      products: [],
      totalProducts: 0,
      filteredProductsCount: 0,
      total: 0,
      page: 1,
      limit: 0,
      totalPages: 1,
    });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const identifier = String(req.params.id || "").trim();
    const projection = "name sku slug price description image images features category inStock createdAt updatedAt";

    if (!identifier || !mongoose.Types.ObjectId.isValid(identifier)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(identifier).select(projection).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select(projection)
      .lean();

    return res.status(200).json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error("GET /api/products/:id error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// POST /api/products
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    console.log("POST /api/products body:", req.body);
    console.log("POST /api/products files:", req.files);

    const { name, price, description, sku, category, inStock, features, image } = req.body || {};

    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      return res.status(400).json({ message: "Product name required" });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "Valid price required" });
    }

    const imagePaths = Array.isArray(req.files)
      ? req.files.map((file) => {
          const filename = String(file?.filename || "").trim();
          if (!filename) return "";

          // Mirror to Next public folder so frontend can load it via same-origin `/uploads/...`.
          try {
            const sourcePath = path.join(process.cwd(), "uploads", filename);
            const publicDir = path.join(process.cwd(), "public", "uploads");
            const targetPath = path.join(publicDir, filename);
            fs.mkdirSync(publicDir, { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
          } catch (copyError) {
            console.error("Failed to mirror upload to public/uploads:", copyError);
          }

          return `/uploads/${filename}`;
        }).filter(Boolean)
      : [];

    const trimmedImageUrl = String(image || "").trim();
    if (trimmedImageUrl) {
      if (!/^https?:\/\//i.test(trimmedImageUrl)) {
        return res.status(400).json({ error: "Invalid image URL" });
      }
    }

    let normalizedFeatures = [];
    if (Array.isArray(features)) {
      normalizedFeatures = features.map((entry) => String(entry || "").trim()).filter(Boolean);
    } else if (typeof features === "string" && features.trim()) {
      const rawFeatures = features.trim();
      try {
        const parsed = JSON.parse(rawFeatures);
        if (Array.isArray(parsed)) {
          normalizedFeatures = parsed.map((entry) => String(entry || "").trim()).filter(Boolean);
        }
      } catch {
        // Ignore malformed JSON-like values and only keep plain text features.
        if (!rawFeatures.startsWith("[") && !rawFeatures.startsWith("{")) {
          normalizedFeatures = [rawFeatures];
        }
      }
    }

    const product = new Product({
      name: trimmedName,
      price: parsedPrice,
      description: String(description || "").trim(),
      sku: String(sku || "").trim().toUpperCase(),
      category: String(category || "").trim(),
      inStock: String(inStock || "").toLowerCase() !== "false",
      images: imagePaths.length > 0 ? imagePaths : trimmedImageUrl ? [trimmedImageUrl] : [],
      image: imagePaths[0] || trimmedImageUrl || "",
      features: normalizedFeatures,
    });

    await product.save();

    await createNotification({
      title: "System Update",
      type: "system",
      message: `New product added: ${product.name}`,
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ message: "Image upload failed" });
  }
});

module.exports = router;
