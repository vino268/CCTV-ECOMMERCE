import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["new_order", "order_cancelled", "new_user"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
    default: "",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
