import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const name = body?.name || "N/A";
    const email = body?.email || "N/A";
    const phone = body?.phone || "N/A";
    const service = body?.service || body?.serviceType || "N/A";
    const message = body?.message || "N/A";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("EMAIL USER:", process.env.EMAIL_USER);
    console.log("Sending service request mail...");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Service Request",
      html: `
        <h2>New Service Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Service:</b> ${service}</p>
        <p><b>Message:</b> ${message}</p>
      `,
    });

    console.log("MAIL SENT SUCCESS");

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.log("MAIL ERROR:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}