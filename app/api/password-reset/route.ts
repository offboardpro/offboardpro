import { NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/lib/firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      handleCodeInApp: false,
    };

    const resetLink = await auth.generatePasswordResetLink(
      normalizedEmail,
      actionCodeSettings
    );

    await resend.emails.send({
      from: "OffboardPro <welcome@offboardpro.com>",
      to: normalizedEmail,
      subject: "Reset your OffboardPro password",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color:#243F74; margin-bottom:8px;">
            Reset your password
          </h1>

          <p style="color:#64748b; line-height:1.6;">
            We received a request to reset your OffboardPro password.
          </p>

          <p style="margin:32px 0;">
            <a
              href="${resetLink}"
              style="
                display:inline-block;
                background:#243F74;
                color:#ffffff;
                text-decoration:none;
                padding:14px 24px;
                border-radius:12px;
                font-weight:700;
              "
            >
              Reset Password
            </a>
          </p>

          <p style="color:#94a3b8; font-size:13px; line-height:1.6;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>

          <p style="color:#94a3b8; font-size:12px; margin-top:32px;">
            © 2026 OffboardPro
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Password reset email error:", error);

    return NextResponse.json(
      { error: "Unable to send password reset email." },
      { status: 500 }
    );
  }
}