import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  // It is better to use the non-public key on the server side
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    // Safety check: Ensure amount is valid
    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const options = {
      /**
       * IMPORTANT FIX: 
       * Your frontend (PricingPage) is already sending the amount in paise (e.g., 19900).
       * We MUST NOT multiply by 100 again, otherwise ₹199 becomes ₹19,900.
       */
      amount: Math.round(amount), 
      currency: "INR",
      receipt: `receipt_offboard_${Date.now()}`,
    };

    // Create the order in Razorpay
    const order = await razorpay.orders.create(options);
    
    // Return the order details to the frontend
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message }, 
      { status: 500 }
    );
  }
}