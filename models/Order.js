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
      productPrice: Number,
      quantity: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  distance: {
    type: Number,
    default: 0,
  },
  deliveryCharge: {
    type: Number,
    default: 0,
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
    enum: ["Pending", "Processing", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
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
    lat: Number,
    lng: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Order", OrderSchema);
