import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Session from "@/models/Session";
import { verifyAdmin } from "@/app/api/admin/_helpers";

export async function PATCH(req, { params }) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (!["block", "unblock"].includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (action === "block") {
      user.isBlocked = true;
      user.blockedAt = new Date();

      // IMPORTANT: kill all sessions for this user
      await Session.deleteMany({ userId: user._id, role: "user" });
      console.log(`[admin/block] User ${user.email} blocked and sessions cleared.`);
    } else if (action === "unblock") {
      user.isBlocked = false;
      user.blockedAt = null;
      console.log(`[admin/block] User ${user.email} unblocked.`);
    }

    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: `User ${action}ed successfully`,
      isBlocked: user.isBlocked 
    });
  } catch (error) {
    console.error("Block/Unblock error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
