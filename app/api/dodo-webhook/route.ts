import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { db } from "@/lib/firebase-admin";

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  environment: "test_mode",
});

type WebhookData = {
  metadata?: Record<string, string> | null;
  subscription_id?: string | null;
  product_id?: string | null;
  billing_frequency?: string | null;
  expires_at?: string | number | null;
  next_billing_date?: string | number | null;
};

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const headers = {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    };

    if (
      !headers["webhook-id"] ||
      !headers["webhook-signature"] ||
      !headers["webhook-timestamp"]
    ) {
      return NextResponse.json(
        { error: "Missing webhook signature headers" },
        { status: 401 }
      );
    }

    const event = dodo.webhooks.unwrap(rawBody, { headers });
    const eventType = event.type;
    const subscription = event.data as WebhookData;

    if (!subscription || typeof subscription !== "object") {
      return NextResponse.json({ received: true });
    }

    const userId = subscription.metadata?.app_user_id;

    if (typeof userId !== "string" || !userId) {
      console.warn("Dodo webhook missing app_user_id metadata");

      return NextResponse.json({
        received: true,
        ignored: "Missing app_user_id",
      });
    }

    const userRef = db.collection("users").doc(userId);

    if (
      eventType === "subscription.active" ||
      eventType === "subscription.renewed" ||
      eventType === "payment.succeeded"
    ) {
      const existingDoc = await userRef.get();
      const existingData = existingDoc.data() ?? {};

      const metadataCycle = subscription.metadata?.billing_cycle;

      const billingCycle =
        metadataCycle === "yearly" ||
        subscription.billing_frequency === "year"
          ? "yearly"
          : metadataCycle === "monthly"
            ? "monthly"
            : existingData.billingCycle ?? "monthly";

      const expiresAt = parseDate(subscription.expires_at);
      const nextBillingDate = parseDate(
        subscription.next_billing_date
      );

      const updates: Record<string, unknown> = {
        isPro: true,
        plan: "Professional",
        billingCycle,
        dodoUpdatedAt: new Date(),
      };

      if (!existingData.upgradedAt) {
        updates.upgradedAt = new Date();
      }

      if (subscription.subscription_id) {
        updates.dodoSubscriptionId = subscription.subscription_id;
      }

      if (subscription.product_id) {
        updates.dodoProductId = subscription.product_id;
      }

      // Never overwrite existing dates with null.
      if (expiresAt) {
        updates.expiresAt = expiresAt;
      }

      if (nextBillingDate) {
        updates.nextBillingDate = nextBillingDate;
      }

      await userRef.set(updates, { merge: true });
    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.expired"
    ) {
      await userRef.set(
        {
          isPro: false,
          dodoUpdatedAt: new Date(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Dodo Webhook Error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}