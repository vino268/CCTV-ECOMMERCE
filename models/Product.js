const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true, uppercase: true },
    price: { type: Number, required: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    images: { type: [String], default: [] },
    features: { type: [String], default: [] },
    category: { type: String, default: "", trim: true },
    inStock: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "products",
  }
);

productSchema.pre("save", function normalizeImages() {
  if (Array.isArray(this.images)) {
    const normalized = this.images
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
    this.images = Array.from(new Set(normalized));
  } else {
    this.images = [];
  }

  if (!this.image && this.images.length > 0) {
    this.image = this.images[0];
  }

  if (this.image && this.images.length === 0) {
    this.images = [this.image];
  }
});

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
