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

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    
    // Also block and kill sessions for safety on delete
    user.isBlocked = true;
    await Session.deleteMany({ userId: user._id, role: "user" });

    await user.save();

    console.log(`[admin/delete] User ${user.email} soft-deleted.`);

    return NextResponse.json({ 
      success: true, 
      message: "User deleted successfully",
      isDeleted: true 
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
