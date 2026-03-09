import mongoose from "mongoose";

if (mongoose.models.Review) {
  delete mongoose.models.Review;
}

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: "",
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ReviewSchema.index({ productId: 1 });

export default mongoose.model("Review", ReviewSchema);
