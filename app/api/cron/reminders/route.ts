import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic'; 

export async function GET(req: Request) {
  console.log("🤖 ROBOT WAKING UP...");

  // 1. SECURITY CHECK
  const authHeader = req.headers.get('authorization');
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
    authHeader !== `Bearer ${process.env.VERCEL_CRON_TOKEN}`
  ) {
    console.error("❌ SECURITY BLOCK: Token mismatch.");
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0]; 
    console.log(`📅 Checking Database for date: ${today}`);

    const snapshot = await db.collection("clients")
      .where("date", "==", today)
      .where("status", "==", "pending")
      .get();

    if (snapshot.empty) {
      console.log("😴 No reviews due today. Going back to sleep.");
      return NextResponse.json({ message: "No reviews due today." });
    }

    console.log(`📊 Found ${snapshot.size} potential clients to offboard.`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "offboardpro@gmail.com",
        pass: "tantokelalvzekdr",
      },
    });

    let sentCount = 0;

    for (const doc of snapshot.docs) {
      const client = doc.data();
      console.log(`🔍 Checking Client: ${client.name} (Owned by: ${client.userId})`);
      
      // 1. DYNAMIC USER LOOKUP
      const userSnap = await db.collection("users").doc(client.userId).get();
      const userData = userSnap.data();

      // 2. SMART EMAIL LOOKUP (Zero-Touch)
      // Check User Profile first, then fallback to the email stored on the Client record
      const targetEmail = userData?.email || client.userEmail || client.email;
      
      const isUserPro = userData?.isPro === true;
      const isEmailEnabled = client.emailEnabled !== false; // Default to true if not set

      console.log(`📡 Target: ${targetEmail} | Pro: ${isUserPro} | Toggle: ${isEmailEnabled}`);

      // 3. THE FINAL CHECK
      if (isUserPro && targetEmail && isEmailEnabled) {
        console.log(`📧 SENDING DYNAMIC EMAIL TO: ${targetEmail}`);
        
        await transporter.sendMail({
          from: '"OffboardPro Alerts" <offboardpro@gmail.com>',
          to: targetEmail,
          subject: `⚠️ Security Reminder: Offboard ${client.name} today`,
          html: `
            <div style="font-family: sans-serif; padding: 30px; border: 1px solid #f1f5f9; border-radius: 24px; max-width: 600px; margin: auto;">
              <h2 style="color: #243F74; font-style: italic; margin-bottom: 20px;">Security Reminder</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6;">Hi ${userData?.displayName || 'Pro User'},</p>
              <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Today is the scheduled review date for <strong>${client.name}</strong>.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Tools to Revoke Access:</p>
                <p style="margin: 8px 0 0 0; color: #9BCB3B; font-weight: 900; font-size: 18px; font-style: italic;">${client.tools || "All associated access"}</p>
              </div>

              <a href="https://offboardpro.vercel.app/dashboard" style="background: #243F74; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 14px;">Open My Dashboard</a>
              
              <p style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; color: #94a3b8; font-size: 12px;">This is an automated reminder from your OffboardPro account.</p>
            </div>
          `
        });
        
        sentCount++;
        console.log(`✅ SUCCESS: Email delivered to ${targetEmail}`);
      } else {
        console.log(`⏭️ SKIPPED: Missing email, Not Pro, or Toggle is OFF.`);
      }
    }

    return NextResponse.json({ success: true, emailsSent: sentCount });

  } catch (error: any) {
    console.error("🚨 ROBOT ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}