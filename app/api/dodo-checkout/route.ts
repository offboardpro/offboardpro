import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { auth } from "@/lib/firebase-admin";

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: "test_mode",
});

const PRODUCTS = {
  monthly: "pdt_0Np5jTgjrkQWHLIcAfQCD",
  yearly: "pdt_0Np5jvO2ADVKM4G1GDWp0",
} as const;

export async function POST(req: Request) {
  try {
    // 1. Get Firebase ID token
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);

    // 2. Verify Firebase user on the server
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 3. Get billing cycle
    const { billingCycle } = (await req.json()) as {
  billingCycle: "monthly" | "yearly";
};

if (billingCycle !== "monthly" && billingCycle !== "yearly") {
  return NextResponse.json(
    { error: "Invalid billing cycle" },
    { status: 400 }
  );
}

// 4. Server-controlled Dodo product
const productId = PRODUCTS[billingCycle];

    // 5. Get customer information from Firebase token
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // 6. Create Dodo checkout session
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        app_user_id: uid,
        billing_cycle: billingCycle,
      },
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { error: "Dodo did not return a checkout URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      checkoutUrl: session.checkout_url,
    });
  } catch (error) {
    console.error("Dodo Checkout Error:", error);

    return NextResponse.json(
      { error: "Failed to create Dodo checkout" },
      { status: 500 }
    );
  }
}