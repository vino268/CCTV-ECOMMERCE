import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Notification from "@/models/Notification";

// PUT /api/orders/cancel/:id
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedStatus = String(body?.status || "Cancelled").trim();
    const source = String(body?.source || "user").toLowerCase();
    const isAdminRequest = source === "admin";
    if (requestedStatus !== "Cancelled") {
      return NextResponse.json(
        { success: false, message: "Only Cancelled status is supported on this endpoint" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ _id: id, isDeleted: { $ne: true } }).select("_id orderNumber orderStatus status");
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const currentStatusRaw = String(order.status || order.orderStatus || "").trim().toLowerCase();

    const normalizeStatus = (value) => {
      const map = {
        ordered: "Order Placed",
        pending: "Order Placed",
        confirmed: "Packed",
        packed: "Packed",
        shipped: "Shipped",
        outfordelivery: "Out for Delivery",
        "out for delivery": "Out for Delivery",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
      };
      return map[value] || "Order Placed";
    };

    const currentStatus = normalizeStatus(currentStatusRaw);

    if (currentStatus === "Cancelled") {
      return NextResponse.json(
        { success: false, message: "Order is already cancelled" },
        { status: 400 }
      );
    }

    if (currentStatus === "Order Placed") {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        {
          $set: {
            status: "Cancelled",
            orderStatus: "Cancelled",
            trackingStatus: "Cancelled",
            cancelledAt: new Date(),
            cancelRequested: false,
          },
        },
        { new: true }
      );

      await Notification.create({
        type: "CANCELLED",
        message: `Order cancelled: ${order.orderId || order.orderNumber || order._id}`,
        orderId: order.orderNumber || "",
      });

      return NextResponse.json({
        success: true,
        action: "cancelled",
        message: "Order cancelled successfully",
        order: updatedOrder,
      });
    }

    if (currentStatus === "Packed") {
      if (order.cancelRequested) {
        return NextResponse.json(
          { success: false, message: "Cancel request already submitted" },
          { status: 400 }
        );
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        {
          $set: {
            cancelRequested: true,
          },
        },
        { new: true }
      );

      await Notification.create({
        type: "STATUS_UPDATED",
        message: `Cancel request raised for order ${order.orderNumber || order._id}`,
        orderId: order.orderNumber || "",
      });

      return NextResponse.json({
        success: true,
        action: "requested",
        message: "Cancel request submitted successfully",
        order: updatedOrder,
      });
    }

    if (currentStatus === "Shipped" || currentStatus === "Out for Delivery" || currentStatus === "Delivered") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancellation is unavailable after shipment. Please contact support.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      message: "Unable to process cancellation request",
    });
  } catch (error) {
    console.error("Cancel order by id error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
