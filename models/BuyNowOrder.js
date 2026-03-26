import mongoose from "mongoose";

if (mongoose.models.BuyNowOrder) {
  delete mongoose.models.BuyNowOrder;
}

const BuyNowOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    product: {
      name: { type: String, default: "" },
      image: { type: String, default: "" },
      price: { type: Number, default: 0 },
      inStock: { type: Boolean, default: true },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 1000 * 60 * 30),
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BuyNowOrder", BuyNowOrderSchema);
