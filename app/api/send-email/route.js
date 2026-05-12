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
  const dateTime = new Date().toLocaleString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric", 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit",
    timeZone: "Asia/Kolkata"
  });

  return `
    <h2>New Enquiry Received</h2>
    <p><b>Name:</b> ${escapeHtml(name)}</p>
    <p><b>Email:</b> ${escapeHtml(email || "-")}</p>
    <p><b>Phone:</b> ${escapeHtml(phone || "-")}</p>
    <p><b>Subject / Service:</b> ${escapeHtml(subjectLabel)}</p>
    <p><b>Message:</b><br/>${escapeHtml(messageText).replace(/\n/g, "<br/>")}</p>
    <p><b>Received at:</b> ${escapeHtml(dateTime)} IST</p>
  `;
}

export async function POST(req) {
  try {
    // Log environment variable status
    console.log("====== EMAIL SERVICE DEBUG ======");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS EXISTS:", !!process.env.EMAIL_PASS);
    console.log("RECEIVER_EMAIL:", process.env.RECEIVER_EMAIL);
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("================================");

    const body = await req.json();
    const name = normalizeText(body?.name);
    const email = normalizeText(body?.email);
    const phone = normalizeText(body?.phone);
    const subject = normalizeText(body?.subject);
    const service = normalizeText(body?.service || body?.serviceType);
    const message = normalizeText(body?.message);
    const isServiceRequest = Boolean(service);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.RECEIVER_EMAIL) {
      console.error("MAIL CONFIG ERROR: Missing required environment variables");
      console.error("EMAIL_USER exists:", !!process.env.EMAIL_USER);
      console.error("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
      console.error("RECEIVER_EMAIL exists:", !!process.env.RECEIVER_EMAIL);
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

    console.log("Starting email send process...");
    
    let transporter;
    try {
      console.log("Creating nodemailer transporter...");
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log("Transporter created successfully");
    } catch (error) {
      console.error("ERROR: Failed to create transporter:", error.message);
      return NextResponse.json(
        { success: false, message: "Email service configuration error" },
        { status: 500 }
      );
    }

    const subjectLabel = normalizeText(subject || service) || "General Enquiry";
    const responseMessage = isServiceRequest
      ? "Service request submitted"
      : "Message sent successfully";

    const mailOptions = {
      from: `"TN Automation" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email || undefined,
      subject: isServiceRequest
        ? `Service Request: ${subjectLabel}`
        : `Contact Enquiry: ${subjectLabel}`,
      html: buildHtml({ name, email, phone, subject, service, message }),
    };

    console.log("✓ Mail options prepared:");
    console.log("  From:", mailOptions.from);
    console.log("  To:", mailOptions.to);
    console.log("  Subject:", mailOptions.subject);
    console.log("  Content length:", mailOptions.html.length, "bytes");

    let sendResult;
    try {
      console.log(">>> SENDING EMAIL NOW <<<");
      sendResult = await transporter.sendMail(mailOptions);
      console.log("✓ EMAIL SENT SUCCESSFULLY");
      console.log("  Response:", sendResult.response);
      console.log("  Message ID:", sendResult.messageId);
    } catch (sendError) {
      console.error("✗ EMAIL SEND FAILED");
      console.error("  Error message:", sendError.message);
      console.error("  Error code:", sendError.code);
      console.error("  Full error:", JSON.stringify(sendError, null, 2));
      throw sendError;
    }

    // Verify email was actually sent before returning success
    if (!sendResult || !sendResult.response) {
      console.error("✗ EMAIL VERIFICATION FAILED - No response from SMTP");
      return NextResponse.json(
        { success: false, message: "Email sending verification failed" },
        { status: 500 }
      );
    }

    console.log("✓ Email verified as sent to:", process.env.RECEIVER_EMAIL);
    return NextResponse.json({
      success: true,
      message: responseMessage,
    });
  } catch (error) {
    console.error("\n===== CRITICAL EMAIL ERROR =====");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error response:", error.response);
    console.error("Full error:", error);
    console.error("=================================\n");
    
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}