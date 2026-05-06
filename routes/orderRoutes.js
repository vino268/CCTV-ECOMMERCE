const express = require("express");
const mongoose = require("mongoose");
const { authenticate, requireAdmin } = require("./auth");

const Product = require("../models/Product");
const Order = require("../models/OrderModel");
const createNotification = require("../utils/createNotification");

const router = express.Router();

const buyNowSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    createdOrderId: { type: String, default: "", trim: true, index: true },
    customOrderId: { type: String, default: "", trim: true },
    orderNumber: { type: String, default: "", trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    product: {
      name: { type: String, default: "" },
      image: { type: String, default: "" },
      price: { type: Number, default: 0 },
      inStock: { type: Boolean, default: true },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 1000 * 60 * 30),
      index: true,
    },
  },
  {
    collection: "buynoworders",
    timestamps: true,
  }
);

const BuyNowOrder =
  mongoose.models.BuyNowOrderApi ||
  mongoose.model("BuyNowOrderApi", buyNowSchema);

function toTrimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function toPositiveNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
}

function normalizePaymentMethod(value) {
  const method = toTrimmed(value || "COD");
  const normalized = method.toLowerCase();
  if (/cod|cash[\s-\-]?on[\s-\-]?delivery/i.test(normalized)) {
    return "COD";
  }
  return method || "COD";
}

function normalizePaymentStatus(value, paymentMethod = "COD") {
  const raw = toTrimmed(value);
  const validStatuses = ["Paid", "Unpaid", "Pending", "Refunded"];
  const matched = validStatuses.find((status) => status.toLowerCase() === raw.toLowerCase());
  if (matched) {
    return matched;
  }
  return paymentMethod === "COD" ? "Pending" : "Paid";
}

function buildOrderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function generateOrderId() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `#TN-${Date.now()}-${rand}`;
}

const ORDER_STATUS_FLOW = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];

function toObjectId(value) {
  const id = toTrimmed(value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : undefined;
}

function normalizeOrderStatus(raw) {
  const value = String(raw || "").trim().toLowerCase();
  const map = {
    pending: "Ordered",
    ordered: "Ordered",
    confirmed: "Packed",
    packed: "Packed",
    shipped: "Shipped",
    outfordelivery: "Out for Delivery",
    "out for delivery": "Out for Delivery",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[value] || "Ordered";
}

async function cancelOrderById(req, res, contextLabel = "") {
  try {
    const orderId = String(req.params?.id || "").trim();
    console.log(`🔍 ${contextLabel} - OrderID:`, orderId);

    const order = await Order.findById(orderId);
    if (!order || order.isDeleted) {
      console.warn(`⚠️  Order not found or deleted:`, orderId);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const requesterId = String(req.user?.id || "").trim();
    const requesterEmail = String(req.user?.email || "").trim().toLowerCase();
    const isOwner =
      (Boolean(requesterId) && String(order.userId || "").trim() === requesterId) ||
      (Boolean(requesterEmail) && String(order.email || "").trim().toLowerCase() === requesterEmail);

    console.log(`👤 Requester: ${requesterEmail || requesterId} | Order Owner: ${order.email || order.userId}`);

    if (!isOwner) {
      console.warn(`❌ Unauthorized cancellation attempt`);
      return res.status(403).json({ success: false, message: "Not your order" });
    }

    const currentStatus = normalizeOrderStatus(order.status || order.trackingStatus || order.orderStatus);
    console.log(`✏️  Current status: ${currentStatus} | Target: Cancelled`);

    if (["Shipped", "Delivered"].includes(currentStatus)) {
      console.warn(`⚠️  Cannot cancel ${currentStatus} order`);
      return res.status(400).json({
        success: false,
        message: "Cannot cancel shipped or delivered order",
      });
    }

    if (currentStatus === "Cancelled") {
      console.log(`ℹ️  Order already cancelled, skipping update`);
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    order.status = "Cancelled";
    order.orderStatus = "Cancelled";
    order.trackingStatus = "Cancelled";
    order.cancelledBy = "USER";
    order.cancelRequested = false;
    order.cancelledAt = new Date();
    await order.save();

    console.log(`✅ Order cancelled successfully by user`);

    const rawOrderIdentifier = toTrimmed(order.orderId || order.orderNumber || order._id);
    const displayOrderIdentifier = rawOrderIdentifier.startsWith("#")
      ? rawOrderIdentifier
      : `#${rawOrderIdentifier}`;

    await createNotification({
      title: "Order Cancelled",
      type: "ORDER_CANCELLED",
      message: `Order ${displayOrderIdentifier} cancelled by user`,
      orderId: order._id,
      isRead: false,
    });

    console.log(`📢 Notification created for order cancellation`);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error(`❌ ${contextLabel} cancel order error:`, error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
}

// POST /api/orders/buy-now
router.post("/buy-now", authenticate, async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { user, product, address } = req.body || {};
    const payloadUser = req.body?.user && typeof req.body.user === "object" ? req.body.user : {};
    const payloadProduct = req.body?.product && typeof req.body.product === "object" ? req.body.product : {};
    const payloadAddress = req.body?.address && typeof req.body.address === "object" ? req.body.address : {};

    const productId = toTrimmed(product?.productId || payloadProduct?.productId || req.body?.productId);
    const userId = toTrimmed(req.user?.id || req.body?.userId || payloadUser?._id);
    const userName = toTrimmed(payloadUser?.name || user?.name || req.user?.name || payloadAddress?.fullName || "Customer");
    const userEmail = toTrimmed(payloadUser?.email || user?.email || req.user?.email || payloadAddress?.email).toLowerCase();
    const payloadItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const payloadDelivery = req.body?.deliveryDetails && typeof req.body.deliveryDetails === "object"
      ? req.body.deliveryDetails
      : payloadAddress;
    const quantity = toPositiveInteger(req.body?.quantity, 1);
    const total = toPositiveNumber(req.body?.totalAmount, toPositiveNumber(req.body?.total, 0));

    if (!productId || !userId || !userEmail) {
      return res.status(400).json({ success: false, message: "user, product and address are required" });
    }

    const dbProduct = await Product.findById(productId).lean().catch(() => null);
    if (!dbProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (dbProduct.inStock === false) {
      return res.status(400).json({ success: false, message: "Product is unavailable" });
    }

    const resolvedProductName = toTrimmed(payloadProduct?.name || dbProduct?.name || payloadItems[0]?.name || payloadItems[0]?.productName || "Product");
    const resolvedProductImage = toTrimmed(payloadProduct?.image || dbProduct?.image || payloadItems[0]?.image || payloadItems[0]?.productImage || "");
    const resolvedUnitPrice = toPositiveNumber(
      payloadProduct?.price,
      toPositiveNumber(payloadItems[0]?.price, toPositiveNumber(payloadItems[0]?.productPrice, Number(dbProduct?.price || 0)))
    );

    const normalizedAddress = {
      fullName: toTrimmed(payloadAddress?.fullName || payloadAddress?.name || payloadDelivery?.name || userName),
      phone: toTrimmed(payloadAddress?.phone || payloadDelivery?.phone),
      email: toTrimmed(payloadAddress?.email || payloadDelivery?.email || userEmail),
      address: toTrimmed(payloadAddress?.address || payloadDelivery?.address),
      city: toTrimmed(payloadAddress?.city || payloadDelivery?.city),
      state: toTrimmed(payloadAddress?.state || payloadDelivery?.state),
      pincode: toTrimmed(payloadAddress?.pincode || payloadDelivery?.pincode),
    };

    console.log("Incoming address:", req.body?.address);

    if (!normalizedAddress.fullName || !normalizedAddress.phone || !normalizedAddress.address || !normalizedAddress.city || !normalizedAddress.state || !normalizedAddress.pincode) {
      return res.status(400).json({
        success: false,
        message: "Complete address is required",
      });
    }

    await BuyNowOrder.deleteMany({
      userId,
      expiresAt: { $lt: new Date() },
    });

    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod || req.body?.payment?.method || req.body?.payment?.paymentMethod);
    const paymentStatus = normalizePaymentStatus(req.body?.paymentStatus || req.body?.payment?.status, paymentMethod);
    const computedTotal = total > 0 ? total : resolvedUnitPrice * quantity;
    let finalizedOrder;
    let createdNewOrder = false;

    const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000);
    const existingOrder = await Order.findOne({
      userId,
      email: userEmail,
      productId,
      "address.fullName": normalizedAddress.fullName,
      "address.phone": normalizedAddress.phone,
      "address.address": normalizedAddress.address,
      "address.city": normalizedAddress.city,
      "address.state": normalizedAddress.state,
      "address.pincode": normalizedAddress.pincode,
      createdAt: { $gte: duplicateWindowStart },
      isDeleted: false,
    }).lean();

    if (existingOrder) {
      finalizedOrder = existingOrder;
    } else {
      finalizedOrder = await Order.create({
        orderId: generateOrderId(),
        orderNumber: buildOrderNumber(),
        user: {
          name: userName,
          email: userEmail,
        },
        product: {
          productId,
          name: resolvedProductName,
          price: resolvedUnitPrice,
          image: resolvedProductImage,
        },
        address: normalizedAddress,
        userRef: toObjectId(userId),
        productRef: toObjectId(productId),
        userId,
        productId,
        quantity,
        total: computedTotal,
        status: "Ordered",
        email: userEmail,
        customerName: userName,
        phone: normalizedAddress.phone,
        items: payloadItems.length
          ? payloadItems.map((item) => ({
              name: toTrimmed(item?.name || item?.productName || resolvedProductName),
              price: toPositiveNumber(item?.price, toPositiveNumber(item?.productPrice, resolvedUnitPrice)),
              quantity: toPositiveInteger(item?.quantity, quantity),
              image: toTrimmed(item?.image || item?.productImage || resolvedProductImage),
            }))
          : [
              {
                name: resolvedProductName,
                price: resolvedUnitPrice,
                quantity,
                image: resolvedProductImage,
              },
            ],
        products: payloadItems.length
          ? payloadItems.map((item) => ({
              productId: toTrimmed(item?.productId || productId),
              productName: toTrimmed(item?.productName || item?.name || resolvedProductName),
              productImage: toTrimmed(item?.productImage || item?.image || resolvedProductImage),
              productPrice: toPositiveNumber(item?.productPrice, toPositiveNumber(item?.price, resolvedUnitPrice)),
              quantity: toPositiveInteger(item?.quantity, quantity),
            }))
          : [
              {
                productId,
                productName: resolvedProductName,
                productImage: resolvedProductImage,
                productPrice: resolvedUnitPrice,
                quantity,
              },
            ],
        totalAmount: computedTotal,
        deliveryDetails: {
          name: normalizedAddress.fullName,
          phone: normalizedAddress.phone,
          email: normalizedAddress.email,
          address: normalizedAddress.address,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          pincode: normalizedAddress.pincode,
        },
        deliveryInfo: {
          firstName: normalizedAddress.fullName,
          lastName: "",
          email: normalizedAddress.email,
          phone: normalizedAddress.phone,
          street: normalizedAddress.address,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          zip: normalizedAddress.pincode,
        },
        paymentStatus: "Unpaid",
        orderStatus: "Ordered",
        trackingStatus: "Ordered",
      });
      createdNewOrder = true;
    }

    if (createdNewOrder) {
      await createNotification({
        title: "New Order Placed",
        type: "order",
        message: `${userName} placed order ${toTrimmed(finalizedOrder?.orderId || finalizedOrder?.orderNumber || finalizedOrder?._id)}`,
        userId,
        orderId: finalizedOrder?._id,
      });
    }

    const buyNowOrder = await BuyNowOrder.create({
      userId,
      productId,
      createdOrderId: String(finalizedOrder?._id || ""),
      customOrderId: toTrimmed(finalizedOrder?.orderId),
      orderNumber: toTrimmed(finalizedOrder?.orderNumber),
      quantity,
      product: {
        name: resolvedProductName,
        image: resolvedProductImage,
        price: resolvedUnitPrice,
        inStock: Boolean(dbProduct.inStock),
      },
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: finalizedOrder,
      orderNumber: toTrimmed(finalizedOrder?.orderNumber),
      orderId: String(buyNowOrder._id),
    });
  } catch (error) {
    console.error("BUY NOW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to place order",
    });
  }
});

// GET /api/orders/buy-now?orderId=...&userId=...
router.get("/buy-now", authenticate, async (req, res) => {
  try {
    const orderId = toTrimmed(req.query?.orderId);
    const userId = toTrimmed(req.user?.id || req.query?.userId);

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const query = {
      _id: orderId,
      expiresAt: { $gt: new Date() },
    };

    if (userId) {
      query.userId = userId;
    }

    const order = await BuyNowOrder.findOne(query).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Buy now session not found" });
    }

    // Backward compatibility: older buy-now sessions may not have createdOrderId.
    if (!toTrimmed(order.createdOrderId)) {
      const fallbackOrder = await Order.findOne({
        isDeleted: false,
        userId: toTrimmed(order.userId),
        $or: [
          ...(toTrimmed(order.customOrderId) ? [{ orderId: toTrimmed(order.customOrderId) }] : []),
          ...(toTrimmed(order.orderNumber) ? [{ orderNumber: toTrimmed(order.orderNumber) }] : []),
          ...(toTrimmed(order.productId)
            ? [
                {
                  productId: toTrimmed(order.productId),
                  createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60) },
                },
              ]
            : []),
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      if (fallbackOrder?._id) {
        await BuyNowOrder.updateOne(
          { _id: order._id },
          {
            $set: {
              createdOrderId: String(fallbackOrder._id),
              customOrderId: toTrimmed(fallbackOrder.orderId),
              orderNumber: toTrimmed(fallbackOrder.orderNumber),
            },
          }
        );

        order.createdOrderId = String(fallbackOrder._id);
        order.customOrderId = toTrimmed(fallbackOrder.orderId);
        order.orderNumber = toTrimmed(fallbackOrder.orderNumber);
      }
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("GET /api/orders/buy-now error:", error);
    return res.status(500).json({ success: false, message: "Failed to load buy now order" });
  }
});

// DELETE /api/orders/buy-now?orderId=...&userId=...
router.delete("/buy-now", authenticate, async (req, res) => {
  try {
    const orderId = toTrimmed(req.query?.orderId);
    const userId = toTrimmed(req.user?.id || req.query?.userId);

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const query = { _id: orderId };
    if (userId) {
      query.userId = userId;
    }

    await BuyNowOrder.deleteOne(query);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE /api/orders/buy-now error:", error);
    return res.status(500).json({ success: false, message: "Failed to clean up buy now order" });
  }
});

// GET /api/orders/my-orders
router.get("/my-orders", authenticate, async (req, res) => {
  try {
    const userId = toTrimmed(req.user?.id);
    const email = toTrimmed(req.user?.email).toLowerCase();

    const query = {
      isDeleted: false,
      $or: [
        ...(userId ? [{ userId }, { user: toObjectId(userId) }] : []),
        ...(email ? [{ email }] : []),
      ],
    };

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json(orders);
  } catch (error) {
    console.error("GET /api/orders/my-orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user orders" });
  }
});

// GET /api/orders/user (legacy alias)
router.get("/user", authenticate, async (req, res) => {
  try {
    const userId = toTrimmed(req.user?.id);
    const email = toTrimmed(req.user?.email).toLowerCase();

    const query = {
      isDeleted: false,
      $or: [
        ...(userId ? [{ userId }, { user: toObjectId(userId) }] : []),
        ...(email ? [{ email }] : []),
      ],
    };

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json(orders);
  } catch (error) {
    console.error("GET /api/orders/user error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user orders" });
  }
});

// GET /api/orders/user/:email
router.get("/user/:email", authenticate, async (req, res) => {
  try {
    const requestedEmail = toTrimmed(req.params?.email).toLowerCase();
    const tokenEmail = toTrimmed(req.user?.email).toLowerCase();
    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";

    if (!requestedEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!isAdmin && requestedEmail !== tokenEmail) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const orders = await Order.find({
      isDeleted: false,
      $or: [
        { email: requestedEmail },
        { "user.email": requestedEmail },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Defensive de-duplication by orderId for accidental duplicate inserts.
    const seen = new Set();
    const deduped = [];
    for (const order of orders) {
      const key = toTrimmed(order?.orderId || order?._id);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push(order);
    }

    return res.status(200).json(deduped);
  } catch (error) {
    console.error("GET /api/orders/user/:email error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user orders" });
  }
});

// GET /api/orders
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = toTrimmed(req.query?.userId);
    const email = toTrimmed(req.query?.email).toLowerCase();

    const query = { isDeleted: false };
    if (userId) {
      query.userId = userId;
    } else if (email) {
      query.email = email;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// POST /api/orders
router.post("/", authenticate, async (req, res) => {
  try {
    const payloadUser = req.body?.user && typeof req.body.user === "object" ? req.body.user : {};
    const payloadProduct = req.body?.product && typeof req.body.product === "object" ? req.body.product : {};
    const payloadAddress = req.body?.address && typeof req.body.address === "object" ? req.body.address : null;

    const productId = toTrimmed(req.body?.productId || payloadProduct.productId);
    const quantity = toPositiveInteger(req.body?.quantity, 1);
    const totalAmount = toPositiveNumber(req.body?.totalAmount, toPositiveNumber(req.body?.total, 0));

    if (!productId || !payloadAddress || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const dbProduct = await Product.findById(productId).lean().catch(() => null);
    if (!dbProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const user = {
      name: toTrimmed(payloadUser.name || req.user?.name || "Customer"),
      email: toTrimmed(payloadUser.email || req.user?.email).toLowerCase(),
    };

    const orderProduct = {
      productId,
      name: toTrimmed(payloadProduct.name || dbProduct?.name || "Product"),
      price: toPositiveNumber(payloadProduct.price, toPositiveNumber(dbProduct?.price, 0)),
      image: toTrimmed(payloadProduct.image || dbProduct?.image),
    };

    const address = {
      fullName: toTrimmed(payloadAddress.fullName || payloadAddress.name),
      phone: toTrimmed(payloadAddress.phone),
      email: toTrimmed(payloadAddress.email || user.email),
      address: toTrimmed(payloadAddress.address),
      city: toTrimmed(payloadAddress.city),
      state: toTrimmed(payloadAddress.state),
      pincode: toTrimmed(payloadAddress.pincode),
    };

    if (!user.email || !orderProduct.productId || !address.fullName || !address.phone || !address.address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000);
    const existingOrder = await Order.findOne({
      isDeleted: false,
      createdAt: { $gte: duplicateWindowStart },
      "user.email": user.email,
      "product.productId": orderProduct.productId,
      "address.fullName": address.fullName,
      "address.phone": address.phone,
      "address.address": address.address,
    }).lean();

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order created successfully",
        duplicate: true,
        order: existingOrder,
      });
    }

    const newOrder = await Order.create({
      orderId: generateOrderId(),
      user,
      product: orderProduct,
      address,
      status: "Ordered",
      paymentStatus: "Unpaid",

      // Compatibility fields used by existing UI components.
      email: user.email,
      customerName: user.name,
      phone: address.phone,
      userId: toTrimmed(req.user?.id),
      productId: orderProduct.productId,
      orderNumber: generateOrderId(),
      quantity,
      total: orderProduct.price * quantity,
      items: [
        {
          name: orderProduct.name,
          price: orderProduct.price,
          quantity,
          image: orderProduct.image,
        },
      ],
      products: [
        {
          productId: orderProduct.productId,
          productName: orderProduct.name,
          productImage: orderProduct.image,
          productPrice: orderProduct.price,
          quantity,
        },
      ],
      totalAmount,
      deliveryDetails: {
        name: address.fullName,
        phone: address.phone,
        email: address.email,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      deliveryInfo: {
        firstName: address.fullName,
        lastName: "",
        email: address.email,
        phone: address.phone,
        street: address.address,
        city: address.city,
        state: address.state,
        zip: address.pincode,
      },
      orderStatus: "Ordered",
      trackingStatus: "Ordered",
    });

    await createNotification({
      title: "New Order Placed",
      type: "order",
      message: `${toTrimmed(user.name || "Customer")} placed order ${toTrimmed(newOrder.orderId || newOrder.orderNumber || newOrder._id)}`,
      userId: req.user?.id,
      orderId: newOrder._id,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET /api/orders/:id
router.get("/:id([0-9a-fA-F]{24})", authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order || order.isDeleted) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    const isOwner =
      String(order.userId || "") === String(req.user?.id || "") ||
      String(order.email || "").toLowerCase() === String(req.user?.email || "").toLowerCase();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("GET /api/orders/:id error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
});

// PUT /api/orders/:id
router.put("/:id([0-9a-fA-F]{24})", authenticate, async (req, res) => {
  try {
    const current = await Order.findById(req.params.id).lean();
    if (!current) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    const isOwner =
      String(current.userId || "") === String(req.user?.id || "") ||
      String(current.email || "").toLowerCase() === String(req.user?.email || "").toLowerCase();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (!isAdmin) {
      const fromCheckout = Boolean(req.body?.fromCheckout);
      if (!fromCheckout) {
        return res.status(403).json({ success: false, error: "Address is locked after order placement" });
      }
      if (Boolean(current.deliveryLocked)) {
        return res.status(403).json({ success: false, error: "Delivery details already locked" });
      }
      const normalizedStatus = String(current.status || current.orderStatus || current.trackingStatus || "").toLowerCase();
      if (!["ordered", "pending", "packed"].includes(normalizedStatus)) {
        return res.status(403).json({ success: false, error: "Order can no longer be updated" });
      }
    }

    const updates = {};
    if (req.body?.deliveryInfo && typeof req.body.deliveryInfo === "object") {
      updates.deliveryInfo = req.body.deliveryInfo;
      const mergedName = `${toTrimmed(req.body.deliveryInfo.firstName)} ${toTrimmed(req.body.deliveryInfo.lastName)}`.trim();
      updates.deliveryDetails = {
        name: mergedName,
        phone: toTrimmed(req.body.deliveryInfo.phone),
        email: toTrimmed(req.body.deliveryInfo.email),
        address: [
          toTrimmed(req.body.deliveryInfo.street),
          toTrimmed(req.body.deliveryInfo.city),
          toTrimmed(req.body.deliveryInfo.state),
          toTrimmed(req.body.deliveryInfo.zip),
        ]
          .filter(Boolean)
          .join(", "),
        city: toTrimmed(req.body.deliveryInfo.city),
        state: toTrimmed(req.body.deliveryInfo.state),
        pincode: toTrimmed(req.body.deliveryInfo.zip),
      };
    }
    if (req.body?.deliveryDetails && typeof req.body.deliveryDetails === "object") {
      updates.deliveryDetails = {
        name: toTrimmed(req.body.deliveryDetails.name),
        phone: toTrimmed(req.body.deliveryDetails.phone),
        email: toTrimmed(req.body.deliveryDetails.email),
        address: toTrimmed(req.body.deliveryDetails.address),
        city: toTrimmed(req.body.deliveryDetails.city),
        state: toTrimmed(req.body.deliveryDetails.state),
        pincode: toTrimmed(req.body.deliveryDetails.pincode),
      };
    }
    if (typeof req.body?.phone === "string") {
      updates.phone = req.body.phone.trim();
    }
    if (!isAdmin) {
      updates.deliveryLocked = true;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("PUT /api/orders/:id error:", error);
    return res.status(500).json({ success: false, error: "Failed to update order" });
  }
});

// PUT /api/orders/:id/address
router.put("/:id([0-9a-fA-F]{24})/address", authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.isDeleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    const isOwner =
      String(order.userId || "") === String(req.user?.id || "") ||
      String(order.email || "").toLowerCase() === String(req.user?.email || "").toLowerCase();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const currentStatus = String(order.status || order.orderStatus || order.trackingStatus || "").trim();
    if (currentStatus !== "Ordered") {
      return res.status(400).json({ success: false, message: "Cannot edit after shipping" });
    }

    const payloadAddress = req.body?.address && typeof req.body.address === "object" ? req.body.address : null;
    if (!payloadAddress) {
      return res.status(400).json({ success: false, message: "address is required" });
    }

    const normalizedAddress = {
      fullName: toTrimmed(payloadAddress.fullName || payloadAddress.name),
      phone: toTrimmed(payloadAddress.phone),
      email: toTrimmed(payloadAddress.email),
      address: toTrimmed(payloadAddress.address),
      city: toTrimmed(payloadAddress.city),
      state: toTrimmed(payloadAddress.state),
      pincode: toTrimmed(payloadAddress.pincode),
    };

    order.address = normalizedAddress;
    order.deliveryDetails = {
      name: normalizedAddress.fullName,
      phone: normalizedAddress.phone,
      email: normalizedAddress.email,
      address: normalizedAddress.address,
      city: normalizedAddress.city,
      state: normalizedAddress.state,
      pincode: normalizedAddress.pincode,
    };
    order.deliveryInfo = {
      firstName: normalizedAddress.fullName,
      lastName: "",
      email: normalizedAddress.email,
      phone: normalizedAddress.phone,
      street: normalizedAddress.address,
      city: normalizedAddress.city,
      state: normalizedAddress.state,
      zip: normalizedAddress.pincode,
    };

    await order.save();

    await createNotification({
      title: "Address Updated",
      type: "address",
      message: `${toTrimmed(req.user?.email || "User")} updated delivery address for order ${toTrimmed(order.orderId || order.orderNumber || order._id)}`,
      userId: req.user?.id,
      orderId: order._id,
    });

    return res.json({ success: true, order });
  } catch (error) {
    console.error("PUT /api/orders/:id/address error:", error);
    return res.status(500).json({ success: false, message: "Failed to update address" });
  }
});

// PUT /api/orders/:id/status (admin)
router.put("/:id([0-9a-fA-F]{24})/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const requested = toTrimmed(req.body?.status || req.body?.orderStatus || req.body?.trackingStatus);
    if (!requested) {
      return res.status(400).json({ success: false, error: "status is required" });
    }

    if (!ORDER_STATUS_FLOW.includes(requested)) {
      return res.status(400).json({ success: false, error: "Invalid order status" });
    }

    const update = {
      status: requested,
      orderStatus: requested,
      trackingStatus: requested,
      cancelledBy: requested === "Cancelled" ? "ADMIN" : null,
      cancelledAt: requested === "Cancelled" ? new Date() : null,
    };
    if (requested === "Delivered") {
      update.paymentStatus = "Paid";
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    await createNotification({
      title: "Order Status Updated",
      type: "order",
      message: `Order ${toTrimmed(order.orderId || order.orderNumber || order._id)} marked as ${requested}`,
      orderId: order._id,
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("PUT /api/orders/:id/status error:", error);
    return res.status(500).json({ success: false, error: "Failed to update order status" });
  }
});

// PUT /api/orders/cancel/:id (legacy)
router.put("/cancel/:id", authenticate, async (req, res) => {
  return cancelOrderById(req, res, "PUT /api/orders/cancel/:id");
});

// PUT /api/orders/:id/cancel (alias)
router.put("/:id([0-9a-fA-F]{24})/cancel", authenticate, async (req, res) => {
  return cancelOrderById(req, res, "PUT /api/orders/:id/cancel");
});

// PATCH /api/orders/:id/cancel
router.patch("/:id([0-9a-fA-F]{24})/cancel", authenticate, async (req, res) => {
  return cancelOrderById(req, res, "PATCH /api/orders/:id/cancel");
});

// POST /api/orders/cancel - accept { orderId } in body for clients that send id in JSON
router.post("/cancel", authenticate, async (req, res) => {
  try {
    const orderIdBody = String(req.body?.orderId || req.body?.id || "").trim();
    if (!orderIdBody) {
      return res.status(400).json({ success: false, message: "orderId is required in body" });
    }
    // route cancel through existing handler by setting params.id
    req.params = req.params || {};
    req.params.id = orderIdBody;
    return cancelOrderById(req, res, "POST /api/orders/cancel");
  } catch (error) {
    console.error("POST /api/orders/cancel error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

// PATCH /api/orders/:id (admin status updates)
router.patch("/:id([0-9a-fA-F]{24})", authenticate, requireAdmin, async (req, res) => {
  try {
    const requested = toTrimmed(req.body?.status || req.body?.orderStatus || req.body?.trackingStatus);
    if (!requested) {
      return res.status(400).json({ success: false, error: "status is required" });
    }

    const update = {
      status: requested,
      orderStatus: requested,
      trackingStatus: requested,
      cancelledBy: requested === "Cancelled" ? "ADMIN" : null,
      cancelledAt: requested === "Cancelled" ? new Date() : null,
    };
    if (requested === "Delivered") {
      update.paymentStatus = "Paid";
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    await createNotification({
      title: requested === "Cancelled" ? "Order Cancelled" : "Order Status Updated",
      type: requested === "Cancelled" ? "ORDER_CANCELLED" : "order",
      message:
        requested === "Cancelled"
          ? `Order #${toTrimmed(order.orderId || order.orderNumber || order._id).replace(/^#/, "")} cancelled by admin`
          : `Order ${toTrimmed(order.orderId || order.orderNumber || order._id)} moved to ${requested}`,
      orderId: order._id,
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("PATCH /api/orders/:id error:", error);
    return res.status(500).json({ success: false, error: "Failed to update order status" });
  }
});

// DELETE /api/orders/:id (soft delete, admin)
router.delete("/:id([0-9a-fA-F]{24})", authenticate, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("DELETE /api/orders/:id error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete order" });
  }
});

module.exports = router;
