export const PAYMENT_METHODS = ["Online", "COD"];

export const PAYMENT_STATUSES = [
  "Pending",
  "Paid",
  "Refund Processing",
  "Refunded",
  "Refund Failed",
  "Unpaid",
  "Failed",
];

export const ORDER_STATUSES = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancellation Requested",
  "Cancelled",
];

export const REFUND_STATUSES = [
  "Not Applicable",
  "Not Initiated",
  "Processing",
  "Refunded",
  "Failed",
];

const STATUS_ALIASES = {
  pending: "Ordered",
  ordered: "Ordered",
  confirmed: "Packed",
  packed: "Packed",
  shipped: "Shipped",
  outfordelivery: "Out for Delivery",
  "out for delivery": "Out for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  "cancellation requested": "Cancellation Requested",
  cancellationrequested: "Cancellation Requested",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

const PAYMENT_STATUS_ALIASES = {
  pending: "Pending",
  paid: "Paid",
  "refund processing": "Refund Processing",
  refundprocessing: "Refund Processing",
  refunded: "Refunded",
  "refund failed": "Refund Failed",
  refundfailed: "Refund Failed",
  unpaid: "Unpaid",
  failed: "Failed",
};

const REFUND_STATUS_ALIASES = {
  "not applicable": "Not Applicable",
  notapplicable: "Not Applicable",
  "not initiated": "Not Initiated",
  notinitiated: "Not Initiated",
  processing: "Processing",
  refunded: "Refunded",
  failed: "Failed",
};

export function normalizePaymentMethod(value) {
  const method = String(value || "COD").trim();
  const normalized = method.toLowerCase();
  if (/cod|cash[\s-]?on[\s-]?delivery/i.test(normalized)) return "COD";
  if (/online|razorpay|upi|card|netbanking/i.test(normalized)) return "Online";
  return PAYMENT_METHODS.includes(method) ? method : "COD";
}

export function normalizeOrderStatus(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Ordered";
  const normalized = raw.toLowerCase();
  return STATUS_ALIASES[normalized] || (ORDER_STATUSES.includes(raw) ? raw : "Ordered");
}

export function normalizePaymentStatus(value, paymentMethod = "COD") {
  const raw = String(value || "").trim();
  if (!raw) {
    return paymentMethod === "COD" ? "Pending" : "Paid";
  }
  const normalized = raw.toLowerCase();
  return PAYMENT_STATUS_ALIASES[normalized] || (PAYMENT_STATUSES.includes(raw) ? raw : paymentMethod === "COD" ? "Pending" : "Paid");
}

export function normalizeRefundStatus(value, paymentMethod = "COD") {
  const raw = String(value || "").trim();
  if (!raw) {
    return paymentMethod === "Online" ? "Not Initiated" : "Not Applicable";
  }
  const normalized = raw.toLowerCase();
  return REFUND_STATUS_ALIASES[normalized] || (REFUND_STATUSES.includes(raw) ? raw : paymentMethod === "Online" ? "Not Initiated" : "Not Applicable");
}

export function canRequestCancellation(orderStatus) {
  const normalized = normalizeOrderStatus(orderStatus);
  return normalized === "Ordered" || normalized === "Packed";
}

export function isRefundRequired(order = {}) {
  return normalizePaymentMethod(order.paymentMethod) === "Online" && normalizePaymentStatus(order.paymentStatus, order.paymentMethod) === "Paid";
}

export function mergeOrderState(order = {}) {
  const paymentMethod = normalizePaymentMethod(order.paymentMethod);
  const orderStatus = normalizeOrderStatus(order.orderStatus || order.status || order.trackingStatus);
  return {
    paymentMethod,
    paymentStatus: normalizePaymentStatus(order.paymentStatus, paymentMethod),
    refundStatus: normalizeRefundStatus(order.refundStatus, paymentMethod),
    orderStatus,
    trackingStatus: orderStatus,
    status: orderStatus,
  };
}