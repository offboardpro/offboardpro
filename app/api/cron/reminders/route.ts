import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic'; // Ensures the robot runs fresh code

export async function GET(req: Request) {
  console.log("🤖 ROBOT WAKING UP...");

  // 1. Security Check Log
  const authHeader = req.headers.get('authorization');
  console.log("🔑 Auth Header Received:", authHeader ? "YES" : "NO");

  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
    authHeader !== `Bearer ${process.env.VERCEL_CRON_TOKEN}`
  ) {
    console.error("❌ SECURITY BLOCK: Token mismatch.");
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0]; 
    console.log("📅 Checking Database for date:", today);

    // 2. Database Lookup Log
    const snapshot = await db.collection("clients")
      .where("date", "==", today)
      .where("status", "==", "pending")
      .get();

    console.log("📊 Found due clients count:", snapshot.size);

    if (snapshot.empty) {
      console.log("😴 No work today. Going back to sleep.");
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
      console.log(`🔍 Checking Client: ${client.name} | Toggle: ${client.emailEnabled}`);
      
      const userSnap = await db.collection("users").doc(client.userId).get();
      const userData = userSnap.data();
      console.log(`👤 User: ${userData?.email} | Pro Status: ${userData?.isPro}`);

      if (userData?.isPro === true && userData?.email && client.emailEnabled === true) {
        console.log(`📧 SENDING EMAIL TO: ${userData.email}...`);
        await transporter.sendMail({
          from: '"OffboardPro Alerts" <offboardpro@gmail.com>',
          to: userData.email,
          subject: `⚠️ Pro Reminder: Offboard ${client.name} today`,
          html: `<b>Today is offboarding day for ${client.name}!</b>` // Simplified for test
        });
        sentCount++;
        console.log(`✅ EMAIL SENT SUCCESS!`);
      } else {
        console.log(`⏭️ SKIPPED: User is not Pro or Toggle is OFF.`);
      }
    }

    return NextResponse.json({ success: true, emailsSent: sentCount });

  } catch (error: any) {
    console.error("🚨 CRITICAL ROBOT ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}