const express = require("express");
const CategoryModel = require("../models/CategoryModel");
const ProductModel = require("../models/Product");

const router = express.Router();

// Public: GET /api/categories
router.get("/", async (_req, res) => {
  try {
    const categories = await CategoryModel.find({}).sort({ name: 1 }).lean();

    const withCounts = await Promise.all(
      (Array.isArray(categories) ? categories : []).map(async (cat) => {
        const categoryId = String(cat?._id || "");
        const categoryName = String(cat?.name || "").trim();

        const productCount = await ProductModel.countDocuments({
          $or: [{ category: categoryId }, { category: categoryName }],
        });

        return {
          ...cat,
          productCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      categories: withCounts,
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      categories: [],
    });
  }
});

// Public: GET /api/categories/with-count
router.get("/with-count", async (_req, res) => {
  try {
    const categories = await CategoryModel.find({}).sort({ name: 1 }).lean();

    const result = await Promise.all(
      (Array.isArray(categories) ? categories : []).map(async (cat) => {
        const categoryId = String(cat?._id || "");
        const categoryName = String(cat?.name || "").trim();

        const count = await ProductModel.countDocuments({
          $or: [
            { category: categoryId },
            { category: categoryName },
          ],
        });

        return {
          ...cat,
          productCount: count,
        };
      })
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("GET /api/categories/with-count error:", error);
    return res.status(500).json({ message: "Failed to fetch category counts" });
  }
});

// POST /api/categories
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/categories payload:", req.body);

    const { name } = req.body || {};
    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "Category name required" });
    }

    const exists = await CategoryModel.findOne({ name: trimmedName }).lean();
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new CategoryModel({ name: trimmedName });
    await newCategory.save();

    return res.status(201).json(newCategory);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    return res.status(500).json({ message: "Failed to create category" });
  }
});

// PUT /api/categories/:id
router.put("/:id", async (req, res) => {
  try {
    console.log("PUT /api/categories/:id payload:", req.body);

    const { name } = req.body || {};
    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "Category name required" });
    }

    const duplicate = await CategoryModel.findOne({
      name: trimmedName,
      _id: { $ne: req.params.id },
    }).lean();

    if (duplicate) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const updated = await CategoryModel.findByIdAndUpdate(
      req.params.id,
      { name: trimmedName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({ message: "Failed to update category" });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CategoryModel.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({ message: "Failed to delete category" });
  }
});

module.exports = router;
