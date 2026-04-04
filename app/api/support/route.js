import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function escapeHtml(input = "") {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, phone, serviceType, message } = body || {};

    if (!name || !phone || !serviceType) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, phone, and service type are required",
        },
        { status: 400 }
      );
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { success: false, message: "Email service is not configured" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const safeServiceType = escapeHtml(serviceType);
    const mailOptions = {
      from: `"TN Automation Support" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New ${serviceType} Request`,
      html: `
        <h2>${safeServiceType} Request</h2>
        <p><b>Name:</b> ${escapeHtml(name)}</p>
        <p><b>Phone:</b> ${escapeHtml(phone)}</p>
        <p><b>Service:</b> ${safeServiceType}</p>
        <p><b>Message:</b><br/>${escapeHtml(message || "No message").replace(/\n/g, "<br/>")}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: `${serviceType} request sent successfully!`,
    });
  } catch (error) {
    console.error("Support email error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send support request" },
      { status: 500 }
    );
  }
}