import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

const REMINDER_STAGES = [
  { daysFromDeadline: 30, key: "30_days" },
  { daysFromDeadline: 14, key: "14_days" },
  { daysFromDeadline: 7, key: "7_days" },
  { daysFromDeadline: 3, key: "3_days" },
  { daysFromDeadline: 0, key: "deadline" },
  { daysFromDeadline: -1, key: "overdue" },
] as const;

type ReminderStage = (typeof REMINDER_STAGES)[number]["key"];

function getDateOnly(value: string): Date | null {
  const parts = value.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  const [year, month, day] = parts;

  return new Date(Date.UTC(year, month - 1, day));
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getReminderStage(daysUntilDeadline: number) {
  return REMINDER_STAGES.find(
    (stage) => stage.daysFromDeadline === daysUntilDeadline
  );
}

async function claimReminder(
  clientRef: FirebaseFirestore.DocumentReference,
  stage: ReminderStage
): Promise<boolean> {
  let claimed = false;

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(clientRef);

    if (!snapshot.exists) {
      return;
    }

    const data = snapshot.data() || {};
    const reminderStages = data.reminderStages || {};
    const existing = reminderStages[stage];

    if (existing?.status === "sent") {
      return;
    }

    if (existing?.status === "sending" && existing.claimedAt) {
      const claimedAt = new Date(existing.claimedAt).getTime();
      const age = Date.now() - claimedAt;

      // Another cron run is currently handling this reminder.
      if (age < 15 * 60 * 1000) {
        return;
      }
    }

    transaction.update(clientRef, {
      [`reminderStages.${stage}`]: {
        status: "sending",
        claimedAt: new Date().toISOString(),
      },
    });

    claimed = true;
  });

  return claimed;
}

export async function GET(req: Request) {
  console.log("🤖 OFFBOARDING REMINDER CRON WAKING UP...");

  // ============================================================
  // 1. SECURITY CHECK
  // ============================================================

  const authHeader = req.headers.get("authorization");

  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    authHeader !== `Bearer ${process.env.VERCEL_CRON_TOKEN}`
  ) {
    console.error("❌ SECURITY BLOCK: Token mismatch.");

    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  // ============================================================
  // 2. RESEND CONFIGURATION
  // ============================================================

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing.");

    return NextResponse.json(
      {
        error: "RESEND_API_KEY is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const today = new Date();

    const todayUtc = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
      )
    );

    const todayString = todayUtc.toISOString().split("T")[0];

    console.log(`📅 Checking reminders for: ${todayString}`);

    // ============================================================
    // 3. GET CLIENTS
    // ============================================================

    const snapshot = await db
      .collection("clients")
      .where("status", "==", "pending")
      .get();

    if (snapshot.empty) {
      console.log("😴 No active clients found.");

      return NextResponse.json({
        success: true,
        emailsSent: 0,
        skipped: 0,
        message: "No active clients.",
      });
    }

    console.log(`📊 Checking ${snapshot.size} active clients.`);

    let sentCount = 0;
    let skippedCount = 0;

    // ============================================================
    // 4. PROCESS CLIENTS
    // ============================================================

    for (const clientDoc of snapshot.docs) {
      const client = clientDoc.data();

      console.log(
        `🔍 Checking client: ${client.name || "Unnamed"}`
      );

      // ----------------------------------------------------------
      // CLOSED CLIENTS SHOULD NEVER RECEIVE REMINDERS
      // ----------------------------------------------------------

      if (client.clientStatus === "closed") {
        console.log("⏭️ SKIPPED: Client is closed.");
        skippedCount++;
        continue;
      }

      // ----------------------------------------------------------
      // ACCESS REMOVAL DEADLINE
      // ----------------------------------------------------------

      const deadlineString = client.accessRemovalDeadline;

      if (!deadlineString) {
        console.log(
          "⏭️ SKIPPED: No access removal deadline."
        );
        skippedCount++;
        continue;
      }

      const deadline = getDateOnly(deadlineString);

      if (!deadline) {
        console.log(
          "⏭️ SKIPPED: Invalid access removal deadline."
        );
        skippedCount++;
        continue;
      }

      const daysUntilDeadline = Math.round(
        (deadline.getTime() - todayUtc.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const stage = getReminderStage(daysUntilDeadline);

      if (!stage) {
        skippedCount++;
        continue;
      }

      console.log(
        `📌 Reminder stage: ${stage.key} (${daysUntilDeadline} days)`
      );

      // ----------------------------------------------------------
      // USER LOOKUP
      // ----------------------------------------------------------

      if (!client.userId) {
        console.log("⏭️ SKIPPED: No userId.");
        skippedCount++;
        continue;
      }

      const userSnap = await db
        .collection("users")
        .doc(client.userId)
        .get();

      const userData = userSnap.data();

      // ----------------------------------------------------------
      // PRO CHECK
      // ----------------------------------------------------------

      const isUserPro = userData?.isPro === true;

      if (!isUserPro) {
        console.log("⏭️ SKIPPED: User is not Pro.");
        skippedCount++;
        continue;
      }

      // ----------------------------------------------------------
      // EMAIL LOOKUP
      // ----------------------------------------------------------

      const targetEmail =
        userData?.email ||
        client.userEmail ||
        client.email ||
        client.createdByEmail;

      const isEmailEnabled = client.emailEnabled !== false;

      console.log(
        `📡 Target: ${targetEmail || "NOT FOUND"} | Pro: ${isUserPro} | Email enabled: ${isEmailEnabled}`
      );

      if (!targetEmail || !isEmailEnabled) {
        console.log(
          `⏭️ SKIPPED: EmailFound=${!!targetEmail}, Enabled=${isEmailEnabled}`
        );

        skippedCount++;
        continue;
      }

      // ----------------------------------------------------------
      // CHECKLIST COMPLETION
      // ----------------------------------------------------------

      const checklist = Array.isArray(client.checklist)
        ? client.checklist
        : [];

      if (checklist.length > 0) {
        const completedTasks = checklist.filter(
          (task: any) =>
            task.status === "removed" ||
            task.status === "not_needed"
        ).length;

        if (completedTasks === checklist.length) {
          console.log(
            "⏭️ SKIPPED: Offboarding checklist is complete."
          );

          skippedCount++;
          continue;
        }
      }

      // ----------------------------------------------------------
      // CLAIM THIS REMINDER
      // ----------------------------------------------------------

      const claimed = await claimReminder(
        clientDoc.ref,
        stage.key
      );

      if (!claimed) {
        console.log(
          `⏭️ SKIPPED: ${stage.key} already sent or currently being processed.`
        );

        skippedCount++;
        continue;
      }

      // ----------------------------------------------------------
      // PREPARE EMAIL
      // ----------------------------------------------------------

      const userName = escapeHtml(
        userData?.displayName ||
          userData?.name ||
          "Pro User"
      );

      const clientName = escapeHtml(
        client.name || "Client"
      );

      const tools = Array.isArray(client.tools)
        ? client.tools.join(", ")
        : client.tools || "All associated access";

      const toolsHtml = escapeHtml(tools);

      const deadlineText = deadline.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }
      );

      let subject: string;
      let heading: string;
      let message: string;

      if (stage.key === "30_days") {
        subject = `OffboardPro: ${client.name} — 30 days until access removal`;
        heading = "30 days until access removal";
        message = `The access-removal deadline for ${client.name} is 30 days away.`;
      } else if (stage.key === "14_days") {
        subject = `OffboardPro: ${client.name} — 14 days until access removal`;
        heading = "14 days until access removal";
        message = `The access-removal deadline for ${client.name} is 14 days away.`;
      } else if (stage.key === "7_days") {
        subject = `OffboardPro: ${client.name} — 7 days until access removal`;
        heading = "7 days until access removal";
        message = `The access-removal deadline for ${client.name} is 7 days away.`;
      } else if (stage.key === "3_days") {
        subject = `OffboardPro: ${client.name} — 3 days until access removal`;
        heading = "3 days until access removal";
        message = `The access-removal deadline for ${client.name} is 3 days away.`;
      } else if (stage.key === "deadline") {
        subject = `⚠️ OffboardPro: ${client.name} — access removal deadline today`;
        heading = "Access removal deadline is today";
        message = `Today is the access-removal deadline for ${client.name}.`;
      } else {
        subject = `⚠️ OffboardPro: ${client.name} — access removal is overdue`;
        heading = "Access removal is overdue";
        message = `The access-removal deadline for ${client.name} was yesterday and the offboarding process is not complete.`;
      }

      // ==========================================================
      // 5. SEND WITH RESEND
      // ==========================================================

      console.log(
        `📧 Sending ${stage.key} reminder to ${targetEmail}`
      );

      const { data, error } = await resend.emails.send({
        from: "OffboardPro <reminders@offboardpro.com>",
        to: [targetEmail],
        subject,
        text: `Hi ${
          userData?.displayName ||
          userData?.name ||
          "Pro User"
        },

${message}

Client: ${client.name || "Client"}
Access removal deadline: ${deadlineText}
Tools: ${tools}

Open your OffboardPro dashboard:
https://offboardpro.vercel.app/dashboard

This is an automated reminder from your OffboardPro account.`,
        html: `
          <div style="
            font-family: Arial, Helvetica, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 32px 20px;
            color: #0f172a;
            background: #ffffff;
          ">

            <div style="
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              padding: 30px;
            ">

              <div style="
                color: #64748b;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                margin-bottom: 12px;
              ">
                OffboardPro
              </div>

              <h1 style="
                margin: 0 0 16px;
                color: #243F74;
                font-size: 25px;
                line-height: 1.3;
              ">
                ${heading}
              </h1>

              <p style="
                color: #475569;
                font-size: 16px;
                line-height: 1.6;
              ">
                Hi ${userName},
              </p>

              <p style="
                color: #1e293b;
                font-size: 16px;
                line-height: 1.6;
              ">
                ${escapeHtml(message)}
              </p>

              <div style="
                margin: 24px 0;
                padding: 20px;
                border-radius: 16px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
              ">

                <div style="
                  color: #64748b;
                  font-size: 10px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                ">
                  Client
                </div>

                <div style="
                  margin-top: 6px;
                  color: #0f172a;
                  font-size: 18px;
                  font-weight: 800;
                ">
                  ${clientName}
                </div>

                <div style="
                  margin-top: 18px;
                  color: #64748b;
                  font-size: 10px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                ">
                  Access removal deadline
                </div>

                <div style="
                  margin-top: 6px;
                  color: #243F74;
                  font-size: 16px;
                  font-weight: 800;
                ">
                  ${deadlineText}
                </div>

                <div style="
                  margin-top: 18px;
                  color: #64748b;
                  font-size: 10px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                ">
                  Tools
                </div>

                <div style="
                  margin-top: 6px;
                  color: #6d941f;
                  font-size: 15px;
                  font-weight: 800;
                ">
                  ${toolsHtml}
                </div>

              </div>

              <a
                href="https://offboardpro.vercel.app/dashboard"
                style="
                  display: inline-block;
                  padding: 14px 22px;
                  border-radius: 12px;
                  background: #243F74;
                  color: #ffffff;
                  text-decoration: none;
                  font-size: 14px;
                  font-weight: 800;
                "
              >
                Open My Dashboard
              </a>

              <p style="
                margin-top: 28px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #94a3b8;
                font-size: 12px;
                line-height: 1.5;
              ">
                This is an automated reminder from your OffboardPro account.
              </p>

            </div>
          </div>
        `,
      });

      // ==========================================================
      // 6. HANDLE RESEND RESULT
      // ==========================================================

      if (error) {
        console.error(
          `❌ Resend failed for ${targetEmail}:`,
          error
        );

        await clientDoc.ref.update({
          [`reminderStages.${stage.key}`]: {
            status: "failed",
            failedAt: new Date().toISOString(),
            error: String(error),
          },
        });

        continue;
      }

      // ==========================================================
      // 7. RECORD SUCCESS
      // ==========================================================

      await clientDoc.ref.update({
        [`reminderStages.${stage.key}`]: {
          status: "sent",
          sentAt: new Date().toISOString(),
          resendId: data?.id || null,
        },
        lastReminderSentAt: new Date().toISOString(),
        lastReminderStage: stage.key,
      });

      sentCount++;

      console.log(
        `✅ SUCCESS: ${stage.key} reminder sent to ${targetEmail}`
      );
    }

    // ============================================================
    // 8. RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      emailsSent: sentCount,
      skipped: skippedCount,
      checkedDate: todayString,
    });
  } catch (error: any) {
    console.error(
      "🚨 OFFBOARDING REMINDER CRON ERROR:",
      error?.message || error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to process reminder cron.",
      },
      { status: 500 }
    );
  }
}