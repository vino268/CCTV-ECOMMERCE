const mongoose = require("mongoose");

const { Schema } = mongoose;

const ORDER_STATUSES = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancellation Requested", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Paid", "Refund Processing", "Refunded", "Refund Failed", "Unpaid", "Failed"];
const REFUND_STATUSES = ["Not Applicable", "Not Initiated", "Processing", "Refunded", "Failed"];

function toObjectId(value) {
  if (!value) return undefined;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : undefined;
}

function generateOrderId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `#TN-${Date.now()}-${rand}`;
}

const orderModelSchema = new Schema(
  {
    // Required core fields for simple order flow
    product: {
      productId: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      image: { type: String, default: "" },
    },
    user: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
    },
    productRef: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: undefined,
    },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
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
    status: {
      type: String,
      enum: ["Ordered", "Packed", "Shipped", "Out for Delivery", "Cancellation Requested", "Delivered", "Cancelled"],
      default: "Ordered",
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ["USER", "ADMIN", null],
      default: null,
      trim: true,
    },

    // Compatibility fields used by existing checkout/account screens
    orderId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      default: "",
      index: true,
    },
    userId: {
      type: String,
      default: "",
      index: true,
    },
    productId: {
      type: String,
      default: "",
      index: true,
    },
    items: [
      {
        name: { type: String, default: "" },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        image: { type: String, default: "" },
      },
    ],
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
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
        productId: { type: String, default: "" },
        productName: { type: String, default: "" },
        productImage: { type: String, default: "" },
        productPrice: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
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
      default: "Ordered",
    },
    deliveryInfo: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zip: { type: String, default: "" },
    },
    deliveryDetails: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    deliveryLocked: {
      type: Boolean,
      default: false,
      index: true,
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
    cancelledAt: {
      type: Date,
      default: null,
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
  },
  {
    collection: "orders",
    timestamps: true,
  }
);

orderModelSchema.pre("validate", function preValidate() {
  if ((!this.product || !this.product.productId) && this.products && this.products.length > 0) {
    this.product = {
      productId: String(this.products[0]?.productId || "").trim(),
      name: String(this.products[0]?.productName || "").trim(),
      price: Number(this.products[0]?.productPrice || 0),
      image: String(this.products[0]?.productImage || "").trim(),
    };
  }

  if (!this.productId && this.products && this.products.length > 0) {
    this.productId = String(this.products[0]?.productId || "").trim();
  }

  if ((!this.user || !this.user.email) && (this.customerName || this.email)) {
    this.user = {
      name: String(this.customerName || "").trim(),
      email: String(this.email || "").trim().toLowerCase(),
    };
  }

  if (!this.userRef && this.userId) {
    this.userRef = toObjectId(this.userId);
  }

  if (!this.productRef && this.productId) {
    this.productRef = toObjectId(this.productId);
  }

  if (!String(this.orderId || "").trim()) {
    this.orderId = generateOrderId();
  }

  if (!this.total || this.total <= 0) {
    this.total = Number(this.totalAmount || 0);
  }

  if (!this.totalAmount || this.totalAmount <= 0) {
    this.totalAmount = Number(this.total || 0);
  }

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

  const orderStatusRaw = String(this.orderStatus || this.status || this.trackingStatus || "").trim();
  const orderStatusLower = orderStatusRaw.toLowerCase();
  if (!orderStatusRaw) {
    this.orderStatus = "Ordered";
  } else if (orderStatusLower === "confirmed") {
    this.orderStatus = "Packed";
  } else if (orderStatusLower === "outfordelivery" || orderStatusLower === "out for delivery" || orderStatusLower === "out_for_delivery") {
    this.orderStatus = "Out for Delivery";
  } else if (orderStatusLower === "cancellation requested" || orderStatusLower === "cancellationrequested") {
    this.orderStatus = "Cancellation Requested";
  } else if (orderStatusLower === "cancelled" || orderStatusLower === "canceled") {
    this.orderStatus = "Cancelled";
  } else if (ORDER_STATUSES.includes(orderStatusRaw)) {
    this.orderStatus = orderStatusRaw;
  } else {
    this.orderStatus = "Ordered";
  }

  this.status = this.orderStatus;
  this.trackingStatus = this.orderStatus;
  if (this.orderStatus === "Cancellation Requested") {
    this.cancellationRequested = true;
  }

  if ((!this.items || this.items.length === 0) && this.products && this.products.length > 0) {
    this.items = this.products.map((item) => ({
      name: String(item?.productName || "").trim(),
      price: Number(item?.productPrice || 0),
      quantity: Number(item?.quantity || 1),
      image: String(item?.productImage || "").trim(),
    }));
  }

  if ((!this.products || this.products.length === 0) && this.items && this.items.length > 0) {
    this.products = this.items.map((item) => ({
      productId: this.productId || "",
      productName: String(item?.name || "").trim(),
      productImage: String(item?.image || "").trim(),
      productPrice: Number(item?.price || 0),
      quantity: Number(item?.quantity || 1),
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
    const addr = [this.deliveryInfo?.street, this.deliveryInfo?.city, this.deliveryInfo?.state, this.deliveryInfo?.zip]
      .filter((value) => String(value || "").trim())
      .join(", ");
    this.deliveryDetails.address = addr;
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
});


module.exports = mongoose.models.OrderModel || mongoose.model("OrderModel", orderModelSchema);
