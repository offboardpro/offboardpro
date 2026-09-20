import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { auth, db } from "@/lib/firebase-admin";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    // 1. Get Firebase ID token from the authenticated client
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

    // 3. Get Razorpay payment details
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing payment verification details" },
        { status: 400 }
      );
    }

    // 4. Verify Razorpay signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    const isValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 5. Fetch the payment directly from Razorpay
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    // 6. Make sure payment belongs to this order
    if (payment.order_id !== razorpay_order_id) {
      return NextResponse.json(
        { error: "Payment does not belong to this order" },
        { status: 400 }
      );
    }

    // 7. Only accept captured payments
    if (payment.status !== "captured") {
      return NextResponse.json(
        { error: "Payment has not been captured" },
        { status: 400 }
      );
    }

    // 8. Fetch the Razorpay order
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // 9. Verify this order belongs to the authenticated Firebase user
    if (order.notes?.userId !== uid) {
      return NextResponse.json(
        { error: "Order does not belong to this user" },
        { status: 403 }
      );
    }

    // 10. Verify the paid amount matches the order
    if (payment.amount !== order.amount) {
      return NextResponse.json(
        { error: "Payment amount does not match the order" },
        { status: 400 }
      );
    }

    // 11. NOW we know:
    // - Firebase user is authenticated
    // - Razorpay signature is valid
    // - Payment belongs to the order
    // - Payment is captured
    // - Order belongs to this Firebase user
    // - Amount matches

    // Grant Pro entitlement from the trusted server.
    // Also make the payment verification idempotent so the
    // same Razorpay payment cannot grant Pro twice.
    const paymentRef = db
      .collection("processedPayments")
      .doc(razorpay_payment_id);
    const userRef = db.collection("users").doc(uid);
    const now = new Date();
    const expiryDate = new Date();

    if (order.notes?.billingCycle === "monthly") {
      expiryDate.setMonth(now.getMonth() + 1);
    } else if (order.notes?.billingCycle === "yearly") {
      expiryDate.setFullYear(now.getFullYear() + 1);
    } else {
      return NextResponse.json(
        { error: "Invalid billing cycle on order" },
        { status: 400 }
      );
    }

    const billingCycle = order.notes!.billingCycle;

    const result = await db.runTransaction(async (transaction) => {
      const processedPayment = await transaction.get(paymentRef);

      // Payment was already successfully processed.
      if (processedPayment.exists) {
        return { alreadyProcessed: true };
      }

      // Record this payment before granting the entitlement.
      transaction.set(paymentRef, {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        userId: uid,
        amount: payment.amount,
        billingCycle,
        processedAt: new Date(),
      });

      transaction.set(
        userRef,
        {
          isPro: true,
          plan: "Professional",
          billingCycle,
          upgradedAt: new Date(),
          expiresAt: expiryDate,
        },
        { merge: true }
      );

      return { alreadyProcessed: false };
    });

    if (result.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);

    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}