import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("webhook-signature");

    const webhookSecret = process.env.DODO_WEBHOOK_SECRET || "";

    if (webhookSecret) {
      const computedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== computedSignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const subscription = event.data;

    if (!subscription) {
      return NextResponse.json({ received: true });
    }

    const productId = subscription.product_id;
    const userId = subscription.metadata?.app_user_id;

    if (typeof userId !== "string" || !userId) {
      console.warn("No app_user_id found in Dodo webhook metadata");
      return NextResponse.json({ received: true });
    }

    const userRef = db.collection("users").doc(userId);

   if (
  eventType === "subscription.active" ||
  eventType === "subscription.renewed" ||
  eventType === "payment.succeeded"
) {
      const billingCycle = subscription.billing_frequency === "year" ? "yearly" : "monthly";

      const expiresAt =
        typeof subscription.expires_at === "string" ||
        typeof subscription.expires_at === "number"
          ? new Date(subscription.expires_at)
          : null;

      const nextBillingDate =
        typeof subscription.next_billing_date === "string" ||
        typeof subscription.next_billing_date === "number"
          ? new Date(subscription.next_billing_date)
          : null;

      await userRef.set({
        isPro: true,
        plan: "Professional",
        billingCycle,
        upgradedAt: new Date(),
        expiresAt,
        nextBillingDate,
        dodoSubscriptionId: subscription.subscription_id,
        dodoProductId: productId,
        dodoUpdatedAt: new Date(),
      }, { merge: true });
    } else if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
      await userRef.set({
        isPro: false,
        dodoUpdatedAt: new Date(),
      }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Dodo Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}