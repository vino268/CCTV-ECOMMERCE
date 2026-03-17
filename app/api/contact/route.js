import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { name, email, phone, location, message } = await req.json();

    if (!name || !email || !phone || !location || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TN Automation Contact" <${process.env.EMAIL_USER}>`,
      to: "kanimohan802@gmail.com",
      replyTo: email,
      subject: `New Contact Form Submission from ${String(name).slice(0, 100)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 20px; margin: 0;">New Contact Form Message</h1>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 8px 0 0;">TN Automation Website</p>
          </div>
          <div style="background: #f8fafc; padding: 28px 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; font-size: 13px; color: #64748b; width: 110px; vertical-align: top;">Name</td>
                <td style="padding: 10px 0; font-size: 14px; color: #1e293b; font-weight: 600;">${escapeHtml(name)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-size: 13px; color: #64748b; vertical-align: top;">Email</td>
                <td style="padding: 10px 0; font-size: 14px; color: #1e293b;">${escapeHtml(email)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-size: 13px; color: #64748b; vertical-align: top;">Phone</td>
                <td style="padding: 10px 0; font-size: 14px; color: #1e293b;">${escapeHtml(phone)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-size: 13px; color: #64748b; vertical-align: top;">Location</td>
                <td style="padding: 10px 0; font-size: 14px; color: #1e293b;">${escapeHtml(location)}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 13px; color: #64748b; margin: 0 0 8px;">Message</p>
              <p style="font-size: 14px; color: #1e293b; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
