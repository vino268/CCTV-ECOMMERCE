import mongoose from "mongoose";

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const ORDER_STATUSES = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancellation Requested", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Paid", "Refund Processing", "Refunded", "Refund Failed", "Unpaid", "Failed"];
const REFUND_STATUSES = ["Not Applicable", "Not Initiated", "Processing", "Refunded", "Failed"];

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
    enum: ["Online", "COD"],
    default: "COD",
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: "Pending",
  },
  razorpayOrderId: {
    type: String,
    default: "",
    trim: true,
  },
  razorpayPaymentId: {
    type: String,
    default: "",
    trim: true,
  },
  razorpaySignature: {
    type: String,
    default: "",
    trim: true,
  },
  orderStatus: {
    type: String,
    enum: ORDER_STATUSES.concat(["Pending"]),
    default: "Ordered",
  },
  trackingStatus: {
    type: String,
    enum: ["Pending", "Ordered", "Packed", "Shipped", "Out for Delivery", "Cancellation Requested", "Delivered", "Cancelled"],
    default: "Ordered",
  },
  status: {
    type: String,
    enum: ["Pending", "Ordered", "Packed", "Shipped", "Out for Delivery", "Cancellation Requested", "Delivered", "Cancelled"],
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
  cancellationRequested: {
    type: Boolean,
    default: false,
  },
  cancellationReason: {
    type: String,
    default: "",
  },
  cancellationRequestedAt: {
    type: Date,
    default: null,
  },
  cancellationApprovedAt: {
    type: Date,
    default: null,
  },
  cancellationRejectedAt: {
    type: Date,
    default: null,
  },
  cancellationRejectionReason: {
    type: String,
    default: "",
  },
  statusBeforeCancellation: {
    type: String,
    default: "",
  },
  refundStatus: {
    type: String,
    enum: REFUND_STATUSES,
    default: "Not Initiated",
  },
  razorpayRefundId: {
    type: String,
    default: "",
    trim: true,
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  refundInitiatedAt: {
    type: Date,
    default: null,
  },
  refundedAt: {
    type: Date,
    default: null,
  },
  refundFailureReason: {
    type: String,
    default: "",
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

function normalizeOrderStatus(value) {
  if (!value || typeof value !== "string") return "Ordered";
  const normalized = value.trim();
  if (normalized === "Confirmed") return "Packed";
  if (normalized === "OutForDelivery") return "Out for Delivery";
  if (["Pending", "Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].includes(normalized)) return normalized;
  return "Ordered";
}

OrderSchema.pre("validate", function ensureOrderId() {
  this.paymentMethod = String(this.paymentMethod || "COD").trim() === "Online" ? "Online" : "COD";
  const paymentStatus = String(this.paymentStatus || "").trim();
  this.paymentStatus = PAYMENT_STATUSES.includes(paymentStatus)
    ? paymentStatus
    : (this.paymentMethod === "COD" ? "Pending" : "Paid");
  if (this.paymentStatus === "Unpaid") {
    this.paymentStatus = this.paymentMethod === "COD" ? "Pending" : "Paid";
  }
  const refundStatus = String(this.refundStatus || "").trim();
  this.refundStatus = REFUND_STATUSES.includes(refundStatus)
    ? refundStatus
    : (this.paymentMethod === "Online" ? "Not Initiated" : "Not Applicable");

  if (!this.status || typeof this.status !== "string" || !this.status.trim()) {
    this.status = normalizeOrderStatus(this.orderStatus);
  }

  this.orderStatus = normalizeOrderStatus(this.orderStatus || this.status || this.trackingStatus);
  this.trackingStatus = normalizeOrderStatus(this.trackingStatus || this.orderStatus || this.status);
  this.status = normalizeOrderStatus(this.status || this.orderStatus || this.trackingStatus);
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

  if (this.orderStatus === "Cancellation Requested") {
    this.cancellationRequested = true;
  }
});


OrderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", OrderSchema);
