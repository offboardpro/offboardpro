import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { db } from "@/lib/firebase-admin";

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  environment: "test_mode",
});

const PRODUCTS = {
  monthly: "pdt_0Np5jTgjrkQWHLIcAfQCD",
  yearly: "pdt_0Np5jvO2ADVKM4G1GDWp0",
} as const;

export async function POST(req: Request) {
  try {
    // 1. Read the raw request body
    const rawBody = await req.text();

    // 2. Verify Dodo webhook signature
    const event = dodo.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": req.headers.get("webhook-id") || "",
        "webhook-signature":
          req.headers.get("webhook-signature") || "",
        "webhook-timestamp":
          req.headers.get("webhook-timestamp") || "",
      },
    });

    console.log("Dodo webhook received:", event.type);

    // We only subscribed to these three events.
    if (
      event.type !== "subscription.active" &&
      event.type !== "subscription.renewed" &&
      event.type !== "subscription.expired"
    ) {
      return NextResponse.json({ received: true });
    }

    const subscription = event.data;

    // 3. Get our Firebase user ID from checkout metadata
    const userId = subscription.metadata?.app_user_id;
    if (typeof userId !== "string" || !userId) {
      console.error(
        "Dodo webhook missing valid app_user_id:",
        subscription.subscription_id
      );

      return NextResponse.json(
        { error: "Missing or invalid user ID" },
        { status: 400 }
      );
    }

    // 4. Verify that this is one of our OffboardPro products
    const productId = subscription.product_id;

    if (
      productId !== PRODUCTS.monthly &&
      productId !== PRODUCTS.yearly
    ) {
      console.error(
        "Unknown OffboardPro Dodo product:",
        productId
      );

      return NextResponse.json(
        { error: "Unknown product" },
        { status: 400 }
      );
    }

    const billingCycle =
      subscription.metadata?.billing_cycle === "yearly"
        ? "yearly"
        : subscription.metadata?.billing_cycle === "monthly"
          ? "monthly"
          : productId === PRODUCTS.yearly
            ? "yearly"
            : "monthly";

    const userRef = db.collection("users").doc(userId);

    // 5. Activate / renew Pro
    if (
      event.type === "subscription.active" ||
      event.type === "subscription.renewed"
    ) {
      const expiresAt =
        typeof subscription.expires_at === "string" ||
        typeof subscription.expires_at === "number"
          ? new Date(subscription.expires_at)
          : null;

      if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        console.error(
          "Invalid Dodo subscription expiry:",
          subscription.expires_at
        );

        return NextResponse.json(
          { error: "Invalid subscription expiry" },
          { status: 400 }
        );
      }

      await userRef.set(
        {
          isPro: true,
          plan: "Professional",
          billingCycle,
          upgradedAt: new Date(),
          expiresAt,
          dodoSubscriptionId: subscription.subscription_id,
          dodoProductId: productId,
          dodoUpdatedAt: new Date(),
        },
        { merge: true }
      );

      console.log(
        `OffboardPro Pro activated/renewed for ${userId}`
      );

      return NextResponse.json({
        success: true,
        event: event.type,
        subscriptionId: subscription.subscription_id,
      });
    }

    // 6. Expire Pro access
    if (event.type === "subscription.expired") {
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        return NextResponse.json({
          success: true,
          message: "User already missing",
        });
      }

      const currentData = userSnapshot.data() || {};
      const currentExpiry = currentData.expiresAt?.toDate
        ? currentData.expiresAt.toDate()
        : null;

      const dodoExpiry =
        typeof subscription.expires_at === "string" ||
        typeof subscription.expires_at === "number"
          ? new Date(subscription.expires_at)
          : null;

      // Do not let an old expired event revoke a newer subscription.
      if (
        currentExpiry &&
        dodoExpiry &&
        !Number.isNaN(dodoExpiry.getTime()) &&
        currentExpiry > dodoExpiry
      ) {
        console.log(
          "Ignoring stale Dodo expiration event:",
          subscription.subscription_id
        );

        return NextResponse.json({
          success: true,
          stale: true,
        });
      }

      await userRef.set(
        {
          isPro: false,
          wasPro: true,
          dodoSubscriptionId: subscription.subscription_id,
          dodoProductId: productId,
          dodoUpdatedAt: new Date(),
        },
        { merge: true }
      );

      console.log(
        `OffboardPro Pro expired for ${userId}`
      );

      return NextResponse.json({
        success: true,
        event: event.type,
        subscriptionId: subscription.subscription_id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo Webhook Error:", error);

    return NextResponse.json(
      { error: "Invalid webhook" },
      { status: 401 }
    );
  }
}