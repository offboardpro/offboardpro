import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic'; 

export async function GET(req: Request) {
  console.log("🤖 ROBOT WAKING UP...");

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
    const snapshot = await db.collection("clients")
      .where("date", "==", today)
      .where("status", "==", "pending")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No reviews due today." });
    }

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
      
      // 1. Get the owner of this client record
      const userSnap = await db.collection("users").doc(client.userId).get();
      const userData = userSnap.data();

      // 2. FULLY DYNAMIC EMAIL LOOKUP:
      // First check the User Profile (userData.email)
      // If missing, check the Client record itself (client.userEmail)
      const targetEmail = userData?.email || client.userEmail;
      
      const isUserPro = userData?.isPro === true;

      // 3. Only send if we found an email AND the user is Pro AND toggle is ON
      if (isUserPro && targetEmail && client.emailEnabled === true) {
        console.log(`📧 SENDING DYNAMIC EMAIL TO: ${targetEmail}`);
        
        await transporter.sendMail({
          from: '"OffboardPro Alerts" <offboardpro@gmail.com>',
          to: targetEmail,
          subject: `⚠️ Security Reminder: Offboard ${client.name} today`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 20px; max-width: 600px; margin: auto;">
              <h2 style="color: #243F74; font-style: italic;">OffboardPro Reminder</h2>
              <p>Hi ${userData?.displayName || 'there'},</p>
              <p>Today is the scheduled offboarding date for <strong>${client.name}</strong>.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase;">Review these tools:</p>
                <p style="margin: 5px 0 0 0; color: #9BCB3B; font-weight: bold; font-size: 16px;">${client.tools || "All associated access"}</p>
              </div>
              <a href="https://offboardpro.vercel.app/dashboard" style="background: #243F74; color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Open My Dashboard</a>
            </div>
          `
        });
        
        sentCount++;
      } else {
        console.log(`⏭️ SKIPPED: Missing email for ${client.name} or User not Pro.`);
      }
    }

    return NextResponse.json({ success: true, emailsSent: sentCount });

  } catch (error: any) {
    console.error("🚨 ROBOT ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}