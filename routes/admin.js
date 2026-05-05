const express = require("express");
const bcrypt = require("bcryptjs");
const { protectAdmin } = require("../middleware/auth");
const Product = require("../models/Product");
const Order = require("../models/OrderModel");

const router = express.Router();

function getAdminCookieOptions(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  const isHttps = req.secure || forwardedProto.includes("https");

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

async function loadSessionAuth() {
  return import("../lib/auth-session.js");
}

async function loadAdminModel() {
  const { default: Admin } = await import("../models/Admin.js");
  return Admin;
}

async function loadUserModel() {
  const { default: User } = await import("../models/User.js");
  return User;
}

async function loadAdminLogModel() {
  const { default: AdminLog } = await import("../models/AdminLog.js");
  return AdminLog;
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const Admin = await loadAdminModel();
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const incomingPassword = String(password || "");
    const storedPassword = String(admin.password || "");
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);

    let isMatch = false;
    if (isBcryptHash) {
      isMatch = await bcrypt.compare(incomingPassword, storedPassword);
    } else {
      // Legacy fallback: allow one successful login with plain-text then upgrade to bcrypt.
      isMatch = incomingPassword === storedPassword;
      if (isMatch) {
        admin.password = await bcrypt.hash(incomingPassword, 10);
        await admin.save();
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const { createAuthSession, getSessionCookieName, getSessionCookieOptions } = await loadSessionAuth();
    const { token } = await createAuthSession({
      userId: admin._id,
      role: "admin",
      email: admin.email,
    });

    res.cookie(getSessionCookieName("admin"), token, getSessionCookieOptions("admin"));

    return res.json({
      success: true,
      token,
      admin: {
        id: String(admin._id),
        email: admin.email || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/customers", protectAdmin, async (req, res) => {
  try {
    const User = await loadUserModel();
    const search = String(req.query?.search || "").trim();
    const status = String(req.query?.status || "all").trim().toLowerCase();

    const roleFilter = {
      $or: [
        { role: "user" },
        { role: { $exists: false } },
        { role: null },
        { role: "" },
      ],
    };

    const query = { $and: [roleFilter] };

    if (status === "active") {
      query.$and.push({ isDeleted: false });
    } else if (status === "deleted") {
      query.$and.push({ isDeleted: true });
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$and.push({
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
          { phone: { $regex: escaped, $options: "i" } },
          { address: { $regex: escaped, $options: "i" } },
        ],
      });
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select("name email phone address createdAt role isDeleted deletedAt isBlocked profileImage avatar")
      .lean();

    const emails = (Array.isArray(users) ? users : [])
      .map((user) => String(user.email || "").toLowerCase())
      .filter(Boolean);

    let statsByEmail = new Map();
    if (emails.length > 0) {
      const orderStats = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
            email: { $in: emails },
          },
        },
        {
          $group: {
            _id: "$email",
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
          },
        },
      ]);

      statsByEmail = new Map(
        (Array.isArray(orderStats) ? orderStats : []).map((item) => [
          String(item._id || "").toLowerCase(),
          item,
        ])
      );
    }

    const customers = (Array.isArray(users) ? users : []).map((user) => {
      const key = String(user.email || "").toLowerCase();
      const stats = statsByEmail.get(key);

      return {
        _id: String(user._id),
        name: String(user.name || ""),
        email: String(user.email || ""),
        phone: String(user.phone || ""),
        address: String(user.address || ""),
        createdAt: user.createdAt,
        isBlocked: !!user.isBlocked,
        isDeleted: !!user.isDeleted,
        deletedAt: user.deletedAt || null,
        totalOrders: Number(stats?.totalOrders || 0),
        totalSpent: Number(stats?.totalSpent || 0),
      };
    });

    return res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch customers", customers: [] });
  }
});

router.get("/profile", protectAdmin, async (req, res) => {
  try {
    const Admin = await loadAdminModel();
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json({
      success: true,
      admin,
    });
  } catch (_error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/activity", protectAdmin, async (req, res) => {
  try {
    const AdminLog = await loadAdminLogModel();
    const pageParam = Number(req.query?.page || 1);
    const limitParam = Number(req.query?.limit || 10);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(50, Math.max(1, Math.floor(limitParam))) : 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AdminLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AdminLog.countDocuments(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      logs: Array.isArray(logs) ? logs : [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/activity error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch logs", logs: [] });
  }
});

router.put("/profile", protectAdmin, async (req, res) => {
  try {
    const Admin = await loadAdminModel();
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const { name, email, phone, profileImage } = req.body || {};

    if (typeof name === "string") admin.name = name.trim();
    if (typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await Admin.findOne({ email: normalizedEmail, _id: { $ne: admin._id } }).lean();
      if (existing) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
      admin.email = normalizedEmail;
    }
    if (typeof phone === "string") admin.phone = phone.trim();
    if (typeof profileImage === "string") admin.profileImage = profileImage.trim();

    await admin.save();

    return res.json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || "",
        profileImage: admin.profileImage || "",
        role: admin.role || "admin",
        createdAt: admin.createdAt || null,
      },
    });
  } catch (error) {
    console.error("PUT /api/admin/profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update admin profile" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { revokeAuthSession, getClearSessionCookieOptions, getSessionCookieName } = await loadSessionAuth();
    await revokeAuthSession(req, "admin").catch(() => null);
    res.cookie(getSessionCookieName("admin"), "", getClearSessionCookieOptions("admin"));
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("POST /api/admin/logout error:", error);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});


router.delete("/profile/avatar", protectAdmin, async (req, res) => {
  try {
    const Admin = await loadAdminModel();
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.avatar = "";
    admin.profileImage = "";
    await admin.save();

    res.json({ message: "Avatar removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard-stats", protectAdmin, async (_req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false }).select("createdAt total totalAmount status orderStatus trackingStatus").lean();

    const grouped = {};
    const statusBuckets = {
      Ordered: 0,
      Packed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    const normalizeStatus = (raw) => {
      const value = String(raw || "").trim().toLowerCase();
      if (value === "cancelled") return "Cancelled";
      if (value === "delivered") return "Delivered";
      if (value === "shipped" || value === "out for delivery" || value === "out_for_delivery" || value === "outfordelivery") return "Shipped";
      if (value === "packed" || value === "confirmed") return "Packed";
      return "Ordered";
    };

    (Array.isArray(orders) ? orders : []).forEach((order) => {
      const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;

      const date = createdAt.toLocaleDateString("en-GB");
      if (!grouped[date]) {
        grouped[date] = 0;
      }

      const value = Number(order?.total ?? order?.totalAmount ?? 0);
      grouped[date] += Number.isFinite(value) ? value : 0;

      const status = normalizeStatus(order?.trackingStatus || order?.orderStatus || order?.status);
      statusBuckets[status] = Number(statusBuckets[status] || 0) + 1;
    });

    const chartData = Object.keys(grouped)
      .map((date) => ({
        date,
        revenue: grouped[date],
      }))
      .sort((a, b) => {
        const [ad, am, ay] = a.date.split("/").map(Number);
        const [bd, bm, by] = b.date.split("/").map(Number);
        return new Date(ay, (am || 1) - 1, ad || 1).getTime() - new Date(by, (bm || 1) - 1, bd || 1).getTime();
      });

    const ordersStatus = Object.entries(statusBuckets).map(([status, count]) => ({
      status,
      count: Number(count || 0),
    }));

    return res.json({ success: true, chartData, ordersStatus });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load dashboard stats" });
  }
});

router.get("/revenue", protectAdmin, async (req, res) => {
  try {
    const rawRange = String(req.query?.range || "7").trim().toLowerCase();
    const parsedDays = Number.parseInt(rawRange, 10);
    const days =
      rawRange === "today" || parsedDays === 1
        ? 1
        : rawRange === "30days" || parsedDays === 30
        ? 30
        : 7;

    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    if (days !== 1) {
      startDate.setDate(startDate.getDate() - (days - 1));
    }

    const filter = {
      isDeleted: false,
      createdAt: { $gte: startDate },
      $or: [
        { paymentStatus: "Paid" },
        { status: "Delivered" },
      ],
    };

    console.log("Revenue Filter:", filter);
    console.log("Matched Orders:", await Order.find(filter));

    const revenueData = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]).allowDiskUse(true);
    const totalRevenue = revenueData.length > 0
      ? revenueData[0].totalRevenue
      : 0;
    const totalOrders = revenueData.length > 0
      ? revenueData[0].totalOrders
      : 0;

    console.log("Revenue: Aggregation returned", revenueData.length, "rows");
    return res.status(200).json({
      total: totalRevenue,
      totalOrders,
      data: [],
    });
  } catch (error) {
    console.error("GET /api/admin/revenue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue data",
    });
  }
});

router.get("/order-status", protectAdmin, async (req, res) => {
  try {
    const rawRange = String(req.query?.range || "7").trim().toLowerCase();
    const parsedDays = Number.parseInt(rawRange, 10);
    const days =
      rawRange === "today" || parsedDays === 1
        ? 1
        : rawRange === "30days" || parsedDays === 30
          ? 30
          : 7;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    if (days !== 1) {
      startDate.setDate(startDate.getDate() - (days - 1));
    }

    const grouped = await Order.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          createdAt: { $gte: startDate },
        },
      },
      {
        $addFields: {
          normalizedStatus: {
            $toLower: {
              $trim: {
                input: {
                  $ifNull: [
                    "$trackingStatus",
                    { $ifNull: ["$orderStatus", { $ifNull: ["$status", "ordered"] }] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          bucket: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$normalizedStatus", "cancelled"] },
                  then: "cancelled",
                },
                {
                  case: { $eq: ["$normalizedStatus", "delivered"] },
                  then: "delivered",
                },
                {
                  case: {
                    $or: [
                      { $eq: ["$normalizedStatus", "shipped"] },
                      { $eq: ["$normalizedStatus", "out for delivery"] },
                      { $eq: ["$normalizedStatus", "out_for_delivery"] },
                      { $eq: ["$normalizedStatus", "outfordelivery"] },
                    ],
                  },
                  then: "shipped",
                },
                {
                  case: {
                    $or: [
                      { $eq: ["$normalizedStatus", "packed"] },
                      { $eq: ["$normalizedStatus", "confirmed"] },
                    ],
                  },
                  then: "packed",
                },
              ],
              default: "ordered",
            },
          },
        },
      },
      {
        $group: {
          _id: "$bucket",
          count: { $sum: 1 },
        },
      },
    ]).allowDiskUse(true);

    const response = {
      ordered: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    (Array.isArray(grouped) ? grouped : []).forEach((entry) => {
      const key = String(entry?._id || "").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(response, key)) {
        response[key] = Number(entry?.count || 0);
      }
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("GET /api/admin/order-status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order status distribution",
    });
  }
});

router.get("/dashboard", protectAdmin, async (_req, res) => {
  try {
    const User = await loadUserModel();

    const range = String(_req.query?.range || "").trim().toLowerCase();
    const now = new Date();
    let startDate = null;
    const filter = { isDeleted: false };

    if (range === "today") {
      startDate = new Date(now);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setUTCHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (range === "7days") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);
      filter.createdAt = { $gte: startDate };
    } else if (range === "30days") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setUTCHours(0, 0, 0, 0);
      filter.createdAt = { $gte: startDate };
    }

    const orders = await Order.find(filter).select("status paymentStatus totalAmount createdAt");
    const ordersCount = Array.isArray(orders) ? orders.length : 0;
    const revenue = (Array.isArray(orders) ? orders : []).reduce((sum, order) => {
      const paymentStatus = String(order?.paymentStatus || "").toLowerCase();
      const orderStatus = String(order?.status || "").toLowerCase();
      if (paymentStatus === "paid" || orderStatus === "delivered") {
        return sum + Number(order?.totalAmount || 0);
      }
      return sum;
    }, 0);

    const productFilter = { isDeleted: { $ne: true } };
    const customerFilter = { role: "user", isDeleted: { $ne: true } };
    if (startDate) {
      productFilter.createdAt = { $gte: startDate };
      customerFilter.createdAt = { $gte: startDate };
    }

    const [totalProducts, totalCustomers] = await Promise.all([
      Product.countDocuments(productFilter),
      User.countDocuments(customerFilter),
    ]);

    return res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders: ordersCount,
        totalCustomers,
        totalRevenue: revenue,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      data: {
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
      },
    });
  }
});

router.get("/latest-orders", protectAdmin, async (_req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId orderNumber customerName email totalAmount orderStatus status trackingStatus createdAt user userRef")
      .lean();

    const latestOrders = (Array.isArray(orders) ? orders : []).map((order) => {
      const populatedUser = order?.userRef && typeof order.userRef === "object" ? order.userRef : null;
      const embeddedUser = order?.user && typeof order.user === "object" ? order.user : null;

      return {
        _id: String(order?._id || ""),
        orderId: String(order?.orderId || order?.orderNumber || order?._id || ""),
        orderNumber: String(order?.orderNumber || order?.orderId || order?._id || ""),
        customerName: String(populatedUser?.name || embeddedUser?.name || order?.customerName || "").trim(),
        email: String(populatedUser?.email || embeddedUser?.email || order?.email || "").trim(),
        totalAmount: Number(order?.totalAmount ?? order?.total ?? 0),
        orderStatus: String(order?.orderStatus || order?.status || order?.trackingStatus || "Ordered"),
        createdAt: order?.createdAt || null,
      };
    });

    return res.json({ success: true, orders: latestOrders });
  } catch (error) {
    console.error("GET /api/admin/latest-orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest orders",
      orders: [],
    });
  }
});

router.get("/latest-customers", protectAdmin, async (_req, res) => {
  try {
    const User = await loadUserModel();
    const users = await User.find({ role: "user", isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt")
      .lean();

    return res.json({
      success: true,
      users: Array.isArray(users) ? users : [],
    });
  } catch (error) {
    console.error("GET /api/admin/latest-customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest customers",
      users: [],
    });
  }
});

router.get("/analytics/overview", protectAdmin, async (_req, res) => {
  try {
    const User = await loadUserModel();

    const [totalProducts, totalOrders, totalCustomers, revenueResult] = await Promise.all([
      Product.countDocuments({}),
      Order.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: "user", isDeleted: { $ne: true } }),
      Order.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const totalRevenue = Number(revenueResult?.[0]?.totalRevenue || 0);

    return res.status(200).json({
      success: true,
      data: {
        range: "7d",
        kpis: {
          totalProducts,
          totalOrders,
          totalCustomers,
          totalRevenue,
        },
        growth: {
          products: 0,
          orders: 0,
          customers: 0,
          revenue: 0,
        },
        charts: {
          revenue: [],
          ordersStatus: [],
        },
        recent: {
          orders: [],
          customers: [],
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/analytics/overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard analytics",
      data: {
        range: "7d",
        kpis: {
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
        },
        growth: {
          products: 0,
          orders: 0,
          customers: 0,
          revenue: 0,
        },
        charts: {
          revenue: [],
          ordersStatus: [],
        },
        recent: {
          orders: [],
          customers: [],
        },
      },
    });
  }
});

router.get("/orders", protectAdmin, async (_req, res) => {
  try {
    // Populate potential refs for richer admin display
    const orders = await Order.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .populate("userRef", "name email phone profileImage")
      .populate("productRef", "name price image")
      .lean();

    return res.status(200).json({ success: true, orders: Array.isArray(orders) ? orders : [] });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders", orders: [] });
  }
});

router.patch("/orders/:id", protectAdmin, async (req, res) => {
  try {
    const nextStatus = String(req.body?.status || req.body?.orderStatus || req.body?.trackingStatus || "").trim();
    if (!nextStatus) {
      return res.status(400).json({ success: false, error: "status is required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: nextStatus,
          orderStatus: nextStatus,
          trackingStatus: nextStatus,
          ...(nextStatus === "Delivered" ? { paymentStatus: "Paid" } : {}),
          cancelledBy: nextStatus === "Cancelled" ? "ADMIN" : null,
          cancelledAt: nextStatus === "Cancelled" ? new Date() : null,
        },
      },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("PATCH /api/admin/orders/:id error:", error);
    return res.status(500).json({ success: false, error: "Failed to update order" });
  }
});

router.put("/orders/:id/cancel", protectAdmin, async (req, res) => {
  try {
    const orderId = String(req.params?.id || "").trim();
    console.log("🔍 Admin cancel order - OrderID:", orderId);

    const order = await Order.findById(orderId);
    if (!order || order.isDeleted) {
      console.warn("⚠️  Order not found or deleted:", orderId);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    console.log("✏️  Current status:", order.status, "| Target: Cancelled");

    // Check if already cancelled
    const currentStatus = String(order.status || order.orderStatus || order.trackingStatus || "").toLowerCase();
    if (currentStatus === "cancelled") {
      console.log("ℹ️  Order already cancelled, skipping update");
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }

    order.status = "Cancelled";
    order.orderStatus = "Cancelled";
    order.trackingStatus = "Cancelled";
    order.cancelledBy = "ADMIN";
    order.cancelledAt = new Date();
    order.cancelRequested = false;
    await order.save();

    console.log("✅ Order cancelled successfully");

    // Create notification for admin action
    const orderIdentifier = String(order.orderId || order.orderNumber || order._id || "").trim();
    const displayOrderIdentifier = orderIdentifier.startsWith("#") ? orderIdentifier : `#${orderIdentifier}`;
    
    await createNotification({
      title: "Order Cancelled",
      type: "ORDER_CANCELLED",
      message: `Order ${displayOrderIdentifier} cancelled by admin`,
      orderId: order._id,
      isRead: false,
    });

    console.log("📢 Notification created for order cancellation");

    return res.status(200).json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("❌ PUT /api/admin/orders/:id/cancel error:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

router.delete("/orders/:id", protectAdmin, async (req, res) => {
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
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("DELETE /api/admin/orders/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete order" });
  }
});

router.get("/orders/deleted", protectAdmin, async (_req, res) => {
  try {
    const deletedOrders = await Order.find({ isDeleted: true })
      .select("orderNumber customerName email deletedAt")
      .sort({ deletedAt: -1, updatedAt: -1 })
      .lean();

    return res.status(200).json(Array.isArray(deletedOrders) ? deletedOrders : []);
  } catch (error) {
    console.error("GET /api/admin/orders/deleted error:", error);
    return res.status(500).json({ error: "Failed to fetch deleted orders" });
  }
});

router.patch("/orders/:id/restore", protectAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("PATCH /api/admin/orders/:id/restore error:", error);
    return res.status(500).json({ error: "Failed to restore order" });
  }
});

router.delete("/orders/:id/permanent", protectAdmin, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id).lean();

    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/orders/:id/permanent error:", error);
    return res.status(500).json({ error: "Failed to permanently delete order" });
  }
});

router.get("/customers/deleted", protectAdmin, async (_req, res) => {
  try {
    const User = await loadUserModel();
    const deletedCustomers = await User.find({
      isDeleted: true,
      role: { $ne: "admin" },
    })
      .select("name email deletedAt")
      .sort({ deletedAt: -1, updatedAt: -1 })
      .lean();

    return res.status(200).json(Array.isArray(deletedCustomers) ? deletedCustomers : []);
  } catch (error) {
    console.error("GET /api/admin/customers/deleted error:", error);
    return res.status(500).json({ error: "Failed to fetch deleted customers" });
  }
});

router.patch("/customers/:id/restore", protectAdmin, async (req, res) => {
  try {
    const User = await loadUserModel();
    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    ).lean();

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error("PATCH /api/admin/customers/:id/restore error:", error);
    return res.status(500).json({ error: "Failed to restore customer" });
  }
});

router.delete("/customers/:id/permanent", protectAdmin, async (req, res) => {
  try {
    const User = await loadUserModel();
    const deleted = await User.findByIdAndDelete(req.params.id).lean();

    if (!deleted) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/customers/:id/permanent error:", error);
    return res.status(500).json({ error: "Failed to permanently delete customer" });
  }
});

module.exports = router;
