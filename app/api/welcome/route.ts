import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "offboardpro@gmail.com", 
        pass: "tantokelalvzekdr", 
      },
    });

    const mailOptions = {
      from: '"OffboardPro" <offboardpro@gmail.com>',
      to: email,
      subject: "Welcome to OffboardPro! 🚀",
      html: `
        <div style="font-family: sans-serif; color: #243F74; padding: 40px; border: 1px solid #f1f5f9; border-radius: 32px; max-width: 600px; margin: auto; background-color: #ffffff;">
          <h1 style="color: #9BCB3B; font-style: italic;">Welcome, ${name}!</h1>
          <p style="font-size: 16px; font-weight: bold;">You're ready to start tracking your client access like a pro.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://offboardpro.com/dashboard" 
               style="background-color: #243F74; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
               Open Your Dashboard
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; 2026 OffboardPro — Clean Handovers, Zero Risk.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email API Error:", error);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}