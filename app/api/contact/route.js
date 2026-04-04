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
    const { name, email, phone, subject, message } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Name, email, and message are required" },
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

    const mailOptions = {
      from: `"TN Automation" <${process.env.EMAIL_USER}>`,
      to: "tnautomation803@gmail.com",
      replyTo: email,
      subject: subject || "New Contact Message",
      html: `
        <h2>New Contact Form Message</h2>
        <p><b>Name:</b> ${escapeHtml(name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Phone:</b> ${escapeHtml(phone || "-")}</p>
        <p><b>Subject:</b> ${escapeHtml(subject || "-")}</p>
        <p><b>Message:</b><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json(
      { success: false, message: "Email sending failed" },
      { status: 500 }
    );
  }
}
