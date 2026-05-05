const mongoose = require("mongoose");

function slugifyProduct(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\'"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true, uppercase: true },
    slug: { type: String, default: "", trim: true, unique: true, sparse: true },
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

productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });

productSchema.pre("save", function normalizeImages() {
  const baseSlug = slugifyProduct(`${this.name || "product"}-${this.sku || ""}`) || slugifyProduct(this.name || "product");
  if (!this.slug) {
    this.slug = baseSlug;
  } else {
    this.slug = slugifyProduct(this.slug);
  }

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
