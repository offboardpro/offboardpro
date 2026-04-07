import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const maxDuration = 10; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;
    const userName = name || "Freelancer";

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
        <!DOCTYPE html>
        <html>
        <body style="background-color: #fcfcfc; margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://offboardpro.vercel.app/logo.png" alt="OffboardPro" style="width: 160px; height: auto; outline: none; border: none; text-decoration: none;">
            </div>

            <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 40px; text-align: left; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <div style="color: #9BCB3B; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">
                Success Account Created
              </div>
              
              <h2 style="color: #243F74; font-size: 26px; font-weight: 800; margin: 0 0 20px 0;">
                Welcome to the family, ${userName}.
              </h2>
              
              <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 30px;">
                You’ve just taken the first step toward building a more professional and secure freelance business. 
                OffboardPro is now ready to help you manage client handovers with zero risk and 100% confidence.
              </p>
              
              <div style="text-align: center;">
                <a href="https://offboardpro.vercel.app/dashboard" 
                   style="background-color: #243F74; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: bold; display: inline-block; font-size: 14px; letter-spacing: 1px;">
                   ACCESS YOUR DASHBOARD
                </a>
              </div>
              
              <p style="margin-top: 40px; font-size: 14px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <strong>Next steps:</strong> Create your first client record and set up your automated offboarding reminders.
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              &copy; 2026 OffboardPro &bull; Clean Handovers &bull; Zero Risk
            </div>
            
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Email API Error:", error);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}