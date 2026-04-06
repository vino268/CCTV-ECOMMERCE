import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, "SKU is required."],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  images: {
    type: [String],
    default: [],
  },
  features: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: "products",
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
