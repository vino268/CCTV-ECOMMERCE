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

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildHtml({ name, email, phone, subject, service, message }) {
  const subjectLabel = normalizeText(subject || service) || "General Enquiry";
  const messageText = normalizeText(message) || "No message provided";

  return `
    <h2>New Enquiry Received</h2>
    <p><b>Name:</b> ${escapeHtml(name)}</p>
    <p><b>Email:</b> ${escapeHtml(email || "-")}</p>
    <p><b>Phone:</b> ${escapeHtml(phone || "-")}</p>
    <p><b>Subject / Service:</b> ${escapeHtml(subjectLabel)}</p>
    <p><b>Message:</b><br/>${escapeHtml(messageText).replace(/\n/g, "<br/>")}</p>
  `;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = normalizeText(body?.name);
    const email = normalizeText(body?.email);
    const phone = normalizeText(body?.phone);
    const subject = normalizeText(body?.subject);
    const service = normalizeText(body?.service || body?.serviceType);
    const message = normalizeText(body?.message);
    const isServiceRequest = Boolean(service);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.RECEIVER_EMAIL) {
      return NextResponse.json(
        { success: false, message: "Email service is not configured" },
        { status: 500 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    if (isServiceRequest) {
      if (!phone) {
        return NextResponse.json(
          { success: false, message: "Phone is required" },
          { status: 400 }
        );
      }

      if (!service) {
        return NextResponse.json(
          { success: false, message: "Service is required" },
          { status: 400 }
        );
      }
    } else {
      if (!email) {
        return NextResponse.json(
          { success: false, message: "Email is required" },
          { status: 400 }
        );
      }
    }

    if (!message && !isServiceRequest) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
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

    const subjectLabel = normalizeText(subject || service) || "General Enquiry";
    const responseMessage = isServiceRequest
      ? "Service request submitted"
      : "Message sent successfully";

    await transporter.sendMail({
      from: `"TN Automation" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email || undefined,
      subject: isServiceRequest
        ? `Service Request: ${subjectLabel}`
        : `Contact Enquiry: ${subjectLabel}`,
      html: buildHtml({ name, email, phone, subject, service, message }),
    });

    return NextResponse.json({
      success: true,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Email enquiry error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}