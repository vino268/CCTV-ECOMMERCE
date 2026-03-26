import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Admin from "@/models/Admin";
import AdminLog from "@/models/AdminLog";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const MAX_FAILED_ATTEMPTS = 6;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const failedLoginAttempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip) {
  const entry = failedLoginAttempts.get(ip);
  if (!entry) return false;

  if (Date.now() - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    failedLoginAttempts.delete(ip);
    return false;
  }

  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const existing = failedLoginAttempts.get(ip);

  if (!existing || now - existing.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    failedLoginAttempts.set(ip, { count: 1, firstAttemptAt: now });
    return;
  }

  existing.count += 1;
  failedLoginAttempts.set(ip, existing);
}

function clearFailedAttempts(ip) {
  failedLoginAttempts.delete(ip);
}

function getAdminEmailAllowlist() {
  return String(process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    const ip = getClientIp(req);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        recordFailedAttempt(ip);
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
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

      const token = await new SignJWT({
        email: user.email,
        role: user.role,
        userId: String(user._id),
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

      const userResponse = {
        userId: String(user._id),
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      };

      const response = NextResponse.json(userResponse);
      response.cookies.set("userToken", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set("adminToken", "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });

      clearFailedAttempts(ip);
      return response;
    }

    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const adminEmailAllowlist = getAdminEmailAllowlist();
    if (adminEmailAllowlist.length > 0 && !adminEmailAllowlist.includes(normalizedEmail)) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Unauthorized Access" },
        { status: 403 }
      );
    }

    const isBcryptHash =
      admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$");
    const isMatch = isBcryptHash
      ? await bcrypt.compare(password, admin.password)
      : password === admin.password;

    if (!isMatch) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!isBcryptHash) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await Admin.findByIdAndUpdate(admin._id, { $set: { password: hashedPassword } });
    }

    const adminToken = await new SignJWT({
      id: String(admin._id),
      email: admin.email,
      role: "admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: "admin",
      createdAt: admin.createdAt,
    });

    response.cookies.set("adminToken", adminToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("userToken", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    clearFailedAttempts(ip);

    try {
      await AdminLog.create({
        adminName: admin.name || admin.email,
        action: "Admin Login",
        details: `Admin login successful from IP ${ip}`,
      });
    } catch {
      // Do not block login if activity logging fails.
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
