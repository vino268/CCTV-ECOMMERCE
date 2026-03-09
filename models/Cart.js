import mongoose from "mongoose";

if (mongoose.models.Cart) {
  delete mongoose.models.Cart;
}

const CartItemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  product: {
    name: String,
    price: Number,
    image: String,
    category: String,
    inStock: Boolean,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

CartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Cart", CartItemSchema);
