import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const CONTACT_INBOX = "hello@offboardpro.com";

// Mirrors the escaping used in the reminder-email cron route: this is
// rendered as HTML, so raw user input needs escaping to prevent injection.
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// The email "Reply-To" header is line-delimited — a value containing a
// newline could inject extra headers if it reached the wire unescaped.
function sanitizeForHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing.");
    return NextResponse.json(
      { error: "Email service is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const topic = String(body?.topic ?? "General question").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are all required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 5000 characters." },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(name);
    const safeTopic = escapeHtml(topic);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const { error } = await resend.emails.send({
      from: "OffboardPro Contact Form <hello@offboardpro.com>",
      to: CONTACT_INBOX,
      replyTo: sanitizeForHeader(email),
      subject: `[Contact] ${sanitizeForHeader(topic)} — ${sanitizeForHeader(name)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #243F74;">New contact form submission</h2>
          <p style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">
            ${safeTopic}
          </p>
          <p><strong>From:</strong> ${safeName} (${escapeHtml(email)})</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send your message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
