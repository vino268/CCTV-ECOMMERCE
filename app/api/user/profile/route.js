import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuthSession } from "@/lib/auth-session";
import cloudinary from "@/lib/cloudinary";

// GET /api/user/profile?email=...
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "User blocked",
          error: "Your account has been blocked. Please contact support.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Fetch user profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT /api/user/profile
export async function PUT(req) {
  try {
    const auth = await verifyAuthSession(req, "user");
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const userId = auth.payload.id;
    const formData = await req.formData();

    const file = formData.get("image");
    const name = formData.get("name");
    const phone = formData.get("phone");
    const dob = formData.get("dob");
    const address = formData.get("address");

    let imageUrl = "";

    if (file && file instanceof File && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // ✅ CORRECT WAY
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "tn-automation" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    await connectDB();

    const updateData = {
      name,
      phone,
      dob: dob || null,
      address,
      ...(imageUrl && { profileImage: imageUrl, avatar: imageUrl }),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
