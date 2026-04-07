import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export async function GET(req: Request) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0]; 

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "offboardpro@gmail.com",
        pass: "tantokelalvzekdr",
      },
    });

    // 2. Find clients due today that are PENDING 
    // We filter by emailEnabled inside the loop to ensure accuracy
    const snapshot = await db.collection("clients")
      .where("date", "==", today)
      .where("status", "==", "pending")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No reviews due today." });
    }

    let sentCount = 0;

    for (const doc of snapshot.docs) {
      const client = doc.data();
      
      // 3. User Lookup
      const userSnap = await db.collection("users").doc(client.userId).get();
      const userData = userSnap.data();

      // 4. THE MASTER CHECK:
      // - Must be a Pro user
      // - Must have a valid email
      // - The specific client toggle (emailEnabled) must be TRUE
      if (
        userData?.isPro === true && 
        userData?.email && 
        client.emailEnabled === true
      ) {
        await transporter.sendMail({
          from: '"OffboardPro Alerts" <offboardpro@gmail.com>',
          to: userData.email,
          subject: `⚠️ Pro Reminder: Offboard ${client.name} today`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 20px; max-width: 600px; margin: auto;">
              <h2 style="color: #243F74; font-style: italic;">Pro Security Alert</h2>
              <p>Today is the scheduled review date for <strong>${client.name}</strong>.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase;">Tools to Revoke:</p>
                <p style="margin: 5px 0 0 0; color: #9BCB3B; font-weight: bold; font-size: 16px;">${client.tools}</p>
              </div>
              <p>You enabled automated reminders for this project. Please ensure all access points are closed.</p>
              <br />
              <a href="https://offboardpro.vercel.app/dashboard" style="background: #243F74; color: white; padding: 12px 20px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Manage Project</a>
            </div>
          `
        });
        sentCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      emailsSent: sentCount,
      totalDueToday: snapshot.size 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}