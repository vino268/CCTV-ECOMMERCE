const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function normalizeOrderIdentifier(value) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return "";
  const lower = cleaned.toLowerCase();
  if (lower === "undefined" || lower === "null") return "";
  const withoutHash = cleaned.startsWith("#") ? cleaned.slice(1).trim() : cleaned;
  return withoutHash;
}

export function resolveOrderLookupValue({ id, body = {} } = {}) {
  const routeValue = normalizeOrderIdentifier(id);
  if (routeValue && (OBJECT_ID_PATTERN.test(routeValue) || !String(body?.orderId || body?.id || body?._id || "").trim())) {
    return routeValue;
  }

  const bodyValue = normalizeOrderIdentifier(body?.orderId || body?.id || body?._id || "");
  if (bodyValue) {
    return bodyValue;
  }

  return routeValue;
}

export function buildOrderLookupQuery(value) {
  const normalized = normalizeOrderIdentifier(value);

  if (!normalized) {
    return { isDeleted: { $ne: true } };
  }

  if (OBJECT_ID_PATTERN.test(normalized)) {
    return { isDeleted: { $ne: true }, _id: normalized };
  }

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    isDeleted: { $ne: true },
    $or: [
      { orderId: normalized },
      { orderNumber: normalized },
      { orderId: { $regex: `^${escaped}$`, $options: "i" } },
      { orderNumber: { $regex: `^${escaped}$`, $options: "i" } },
    ],
  };
}

export async function findOrderByIdentifier(OrderModel, value) {
  return OrderModel.findOne(buildOrderLookupQuery(value));
}
