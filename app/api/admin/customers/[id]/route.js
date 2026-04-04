import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import { adminAuthError, verifyAdmin } from "@/app/api/admin/_helpers";

async function getUserById(id) {
  return User.findOne({ _id: id, role: "user" }).select("-password");
}

function userOrderQuery(user) {
  return {
    isDeleted: false,
    $or: [{ userId: String(user._id) }, { email: user.email }],
  };
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const orders = await Order.find(userOrderQuery(user)).sort({ createdAt: -1 });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return NextResponse.json({
      customer: user,
      insights: {
        totalOrders,
        totalSpent,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;
    const { isBlocked } = await req.json();

    if (typeof isBlocked !== "boolean") {
      return NextResponse.json(
        { error: "isBlocked boolean is required" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          isBlocked,
          blockedAt: isBlocked ? new Date() : null,
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: isBlocked ? "Customer blocked" : "Customer unblocked", customer: user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) return adminAuthError(auth);

    await connectDB();
    const { id } = await params;

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Customer moved to trash successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
