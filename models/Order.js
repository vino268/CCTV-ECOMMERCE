import mongoose from "mongoose";

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    default: "",
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    default: "",
  },
  products: [
    {
      productId: String,
      productName: String,
      productImage: String,
      productPrice: Number,
      quantity: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    default: "COD",
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Unpaid", "Refunded"],
    default: "Paid",
  },
  orderStatus: {
    type: String,
    enum: ["Pending", "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Ordered",
  },
  trackingStatus: {
    type: String,
    enum: ["Pending", "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Ordered",
  },
  status: {
    type: String,
    enum: ["Pending", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Pending",
  },
  deliveryInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zip: String,
  },
  confirmedAt: {
    type: Date,
    default: null,
  },
  shippedAt: {
    type: Date,
    default: null,
  },
  outForDeliveryAt: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  estimatedDelivery: {
    type: Date,
    default: null,
  },
  trackingNumber: {
    type: String,
    default: "",
  },
  cancelRequested: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);
