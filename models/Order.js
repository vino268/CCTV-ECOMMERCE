import mongoose from "mongoose";

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  total: {
    type: Number,
    default: 0,
    min: 0,
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    default: "",
  },
  productId: {
    type: String,
    default: "",
  },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
      image: String,
    },
  ],
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
  address: {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
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
    enum: ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Ordered",
  },
  cancelledBy: {
    type: String,
    enum: ["USER", "ADMIN", null],
    default: null,
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
  deliveryDetails: {
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  deliveryLocked: {
    type: Boolean,
    default: false,
    index: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

function generateOrderId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `#TN-${Date.now()}-${rand}`;
}

OrderSchema.pre("validate", function ensureOrderId(next) {
  if ((!this.items || this.items.length === 0) && this.products && this.products.length > 0) {
    this.items = this.products.map((item) => ({
      name: String(item?.productName || "").trim(),
      price: Number(item?.productPrice || 0),
      quantity: Number(item?.quantity || 1),
      image: String(item?.productImage || "").trim(),
    }));
  }

  if (!this.deliveryDetails || typeof this.deliveryDetails !== "object") {
    this.deliveryDetails = { name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" };
  }

  if (!String(this.deliveryDetails?.name || "").trim()) {
    const fullName = `${this.deliveryInfo?.firstName || ""} ${this.deliveryInfo?.lastName || ""}`.trim();
    this.deliveryDetails.name = fullName;
  }

  if (!String(this.deliveryDetails?.phone || "").trim()) {
    this.deliveryDetails.phone = String(this.deliveryInfo?.phone || this.phone || "").trim();
  }

  if (!String(this.deliveryDetails?.address || "").trim()) {
    this.deliveryDetails.address = [this.deliveryInfo?.street, this.deliveryInfo?.city, this.deliveryInfo?.state, this.deliveryInfo?.zip]
      .filter((value) => String(value || "").trim())
      .join(", ");
  }

  if (!String(this.deliveryDetails?.email || "").trim()) {
    this.deliveryDetails.email = String(this.deliveryInfo?.email || this.email || "").trim();
  }

  if (!String(this.deliveryDetails?.city || "").trim()) {
    this.deliveryDetails.city = String(this.deliveryInfo?.city || "").trim();
  }

  if (!String(this.deliveryDetails?.state || "").trim()) {
    this.deliveryDetails.state = String(this.deliveryInfo?.state || "").trim();
  }

  if (!String(this.deliveryDetails?.pincode || "").trim()) {
    this.deliveryDetails.pincode = String(this.deliveryInfo?.zip || "").trim();
  }

  if (!String(this.orderId || "").trim()) {
    this.orderId = generateOrderId();
  }
  next();
});

OrderSchema.index({ orderId: 1 }, { unique: true });

export default mongoose.model("Order", OrderSchema);
