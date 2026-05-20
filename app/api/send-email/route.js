import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { name, email, phone, service, message } = await req.json();
    const isServiceRequest = Boolean(service);
    const senderEmail = (process.env.EMAIL_USER || "").trim();
    const senderPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
    const receiverEmail = (process.env.EMAIL_RECEIVER || "").trim();

    if (!senderEmail || !senderPass) {
      return NextResponse.json(
        { success: false, message: "Email sender credentials are missing" },
        { status: 500 }
      );
    }

    if (!receiverEmail) {
      return NextResponse.json(
        { success: false, message: "Receiver email is missing. Set EMAIL_RECEIVER." },
        { status: 500 }
      );
    }

    const subject = isServiceRequest ? "New Service Request" : "New Contact Message";
    const htmlTemplate = isServiceRequest
      ? `
        <h2>New Service Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Service:</b> ${service}</p>
        <p><b>Message:</b> ${message}</p>
      `
      : `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b> ${message}</p>
      `;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("EMAIL USER:", senderEmail);
    console.log("EMAIL RECEIVER:", receiverEmail);
    console.log(isServiceRequest ? "Sending service request mail..." : "Sending contact message mail...");

    await transporter.sendMail({
      from: `"TN Automation" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      replyTo: email,
      subject: subject || "New Contact Message",
      html: htmlTemplate,
    });

    console.log("MAIL SENT SUCCESS");

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("MAIL ERROR:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}