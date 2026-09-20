import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/lib/firebase-admin";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    // 2. Verify the Firebase user on the server
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 3. Get billing cycle from frontend
    const { billingCycle } = await req.json();

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json(
        { error: "Invalid billing cycle" },
        { status: 400 }
      );
    }

    // 4. Server-controlled pricing
    const amount =
      billingCycle === "monthly"
        ? 19900   // ₹199
        : 199000; // ₹1,990

    // 5. Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_offboard_${Date.now()}`,
      notes: {
        userId: uid,
        plan: "Professional",
        billingCycle,
      },
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}