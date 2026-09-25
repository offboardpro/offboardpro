"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// 1. Import Firebase Auth and Firestore
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import confetti from "canvas-confetti"; // Confetti Import

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  // Billing Cycle State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Load Auth and Real-time Pro Status from Firestore
  useEffect(() => {
    // Check cache initially for snappier UI
    const cachedStatus = localStorage.getItem("offboardpro_isPro");
    if (cachedStatus === "true") {
      setIsPro(true);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);

        const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const status = data.isPro || false;
            const expiryDate = data.expiresAt?.toDate();
            const today = new Date();

            // --- IMPROVED LOGIC: Check if Pro status exists first ---
            if (status) {
              // Only revoke Pro if an expiry date specifically exists and has passed
              if (expiryDate && today > expiryDate) {
                setIsPro(false);
                localStorage.setItem("offboardpro_isPro", "false");
              } else {
                setIsPro(true);
                localStorage.setItem("offboardpro_isPro", "true");
              }
            } else {
              setIsPro(false);
              localStorage.setItem("offboardpro_isPro", "false");
            }
          } else {
            setIsPro(false);
            localStorage.setItem("offboardpro_isPro", "false");
          }
          setLoading(false);
        }, (error) => {
          console.error("Pricing sync error:", error);
          setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setIsPro(false);
        setLoading(false);
      }
    });

    const timer = setTimeout(() => setLoading(false), 3000);

    return () => {
      unsubscribeAuth();
      clearTimeout(timer);
    };
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login?redirect=pricing");
      return;
    }

    try {
      const idToken = await user.getIdToken();

      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          billingCycle,
        }),
      });

      const order = await res.json();

      if (!order.id) {
        alert("Failed to create order. Please try again.");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "OffboardPro",
        description: `${billingCycle.toUpperCase()} Pro Subscription`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const idToken = await user.getIdToken();
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const result = await verifyRes.json();

            if (!verifyRes.ok || !result.success) {
              console.error("Payment verification failed:", result);
              alert("Payment could not be verified. Please contact support.");
              setIsUpgrading(false);
              return;
            }

            await finalizeCloudUpgrade();
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
            setIsUpgrading(false);
          }
        },
        prefill: {
          name: user.displayName || "Freelancer",
          email: user.email || "",
        },
        theme: { color: "#243F74" },
        modal: {
          ondismiss: function() {
            setIsUpgrading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      alert("Could not start payment. Please try again.");
    }
  };

  const finalizeCloudUpgrade = async () => {
    setIsUpgrading(true);

    const preventClose = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", preventClose);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#243F74", "#9BCB3B", "#ffffff"],
    });

    try {
      // The server has already verified the payment
      // and granted the Pro entitlement.
      localStorage.setItem("offboardpro_isPro", "true");
      setIsPro(true);

      setTimeout(() => {
        window.removeEventListener("beforeunload", preventClose);
        setIsUpgrading(false);
        router.push("/success");
      }, 2500);
    } catch (error) {
      console.error("Upgrade finalization failed:", error);
      window.removeEventListener("beforeunload", preventClose);
      setIsUpgrading(false);
      alert("Payment was verified, but something went wrong. Please contact support.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-[#243F74] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white relative font-sans selection:bg-[#9BCB3B]/20">

      {/* =========================
          UPGRADE SUCCESS OVERLAY
      ========================== */}
      {isUpgrading && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-8">
            <div
              style={{ backgroundColor: "#9BCB3B" }}
              className="absolute inset-0 rounded-full opacity-20 animate-ping"
            />

            <div className="relative bg-white border-4 border-[#9BCB3B] w-full h-full rounded-full flex items-center justify-center shadow-2xl shadow-[#9BCB3B]/20">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-[#9BCB3B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h2
            style={{ color: "#243F74" }}
            className="text-3xl sm:text-4xl font-black italic mb-2 tracking-tight"
          >
            Welcome to Pro.
          </h2>

          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] sm:tracking-[0.3em] mb-8 text-center">
            Unlocking your premium features...
          </p>

          <button
            disabled
            style={{ backgroundColor: "#243F74" }}
            className="px-8 sm:px-10 py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-xl animate-pulse"
          >
            Finalizing your account...
          </button>
        </div>
      )}

      {/* =========================
          NAVIGATION
      ========================== */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-5 sm:py-7 md:py-8 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center transition-transform hover:scale-105"
        >
          <Image
            src="/logo.png"
            alt="OffboardPro"
            width={140}
            height={45}
            className="object-contain w-[120px] sm:w-[140px] h-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-3 sm:gap-5 md:gap-6">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[9px] font-black text-slate-300 tracking-widest leading-none mb-1">
              Status
            </span>

            <span
              style={{ color: isPro ? "#9BCB3B" : "#243F74" }}
              className="text-[10px] font-black tracking-widest italic"
            >
              {isPro ? "✓ Pro Member" : "Free Plan"}
            </span>
          </div>

          <Link
            href="/dashboard"
            className="text-slate-400 font-bold text-sm hover:text-[#243F74] transition-colors border-l pl-3 sm:pl-5 md:pl-6 border-slate-100"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* =========================
          MAIN
      ========================== */}
      <main className="w-full max-w-6xl mx-auto pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-24 md:pb-28 px-4 sm:px-6">

        {/* =========================
            HERO
        ========================== */}
        <div className="text-center mb-10 sm:mb-14 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

          <h1
            style={{ color: "#243F74" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6 italic leading-tight"
          >
            Simple pricing.
            <br />
            <span style={{ color: "#9BCB3B" }}>
              Built around your workflow.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Start with the core offboarding workflow for free. Upgrade when you
            need more clients, automation, and team coordination.
          </p>

          {/* =========================
              BILLING TOGGLE
          ========================== */}
          <div className="inline-flex items-center justify-center gap-1 sm:gap-2 mt-8 sm:mt-10 bg-slate-50 p-1.5 rounded-full border border-slate-100">

            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 sm:px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-[#243F74] shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 sm:px-6 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-white text-[#243F74] shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Yearly

              <span className="bg-[#9BCB3B] text-white text-[8px] px-2 py-0.5 rounded-full tracking-tight">
                Save 15%
              </span>
            </button>

          </div>
        </div>

        {/* =========================
            PRICING CARDS
        ========================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7 md:gap-8 max-w-5xl mx-auto">

          {/* =========================
              FREE PLAN
          ========================== */}
          <div
            className={`border border-slate-200 p-6 sm:p-8 md:p-10 lg:p-12 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col bg-white transition-all duration-500 hover:shadow-xl ${
              isPro ? "opacity-60" : "opacity-100"
            }`}
          >
            <div className="mb-7 sm:mb-8">

              <p className="text-slate-400 font-black text-xs tracking-[0.2em] mb-3">
                FREE
              </p>

              <div className="flex items-baseline gap-2">
                <span
                  style={{ color: "#243F74" }}
                  className="text-5xl sm:text-6xl font-black italic"
                >
                  ₹0
                </span>

                <span className="text-slate-400 font-bold text-sm">
                  / forever
                </span>
              </div>

              <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed">
                Everything you need to start managing client offboarding.
              </p>
            </div>

            <div className="h-px bg-slate-100 mb-7 sm:mb-8" />

            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow">

              {[
                "Up to 3 active clients",
                "Client & project management",
                "Tool library & templates",
                "Generated offboarding checklists",
                "Task & progress tracking",
                "Client workspace & activity timeline",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 font-semibold"
                >
                  <span className="text-[#9BCB3B] font-black shrink-0 mt-0.5">
                    ✓
                  </span>

                  <span>{feature}</span>
                </li>
              ))}

            </ul>

            <button
              type="button"
              disabled
              className="w-full py-4 sm:py-5 rounded-2xl border-2 border-slate-200 text-slate-400 font-black text-xs tracking-[0.15em] text-center cursor-not-allowed"
            >
              {isPro ? "Previous Plan" : "Current Plan"}
            </button>
          </div>

          {/* =========================
              PRO PLAN
          ========================== */}
          <div
            style={{ borderColor: "#9BCB3B" }}
            className="border-2 p-6 sm:p-8 md:p-10 lg:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-[#9BCB3B]/10 flex flex-col relative bg-white overflow-hidden transition-all duration-500 hover:-translate-y-1"
          >

            {/* Badge */}
            {!isPro && (
              <div
                style={{ backgroundColor: "#9BCB3B" }}
                className="absolute top-0 right-0 px-4 sm:px-6 py-2 text-white text-[10px] font-black rounded-bl-2xl tracking-widest"
              >
                PRO
              </div>
            )}

            {isPro && (
              <div
                style={{ backgroundColor: "#243F74" }}
                className="absolute top-0 right-0 px-4 sm:px-6 py-2 text-white text-[10px] font-black rounded-bl-2xl tracking-widest"
              >
                ACTIVE
              </div>
            )}

            <div className="mb-7 sm:mb-8">

              <p className="text-[#243F74] font-black text-xs tracking-[0.2em] mb-3">
                PRO
              </p>

              <div className="flex items-baseline gap-2">
                <span
                  style={{ color: "#243F74" }}
                  className="text-5xl sm:text-6xl font-black italic"
                >
                  {billingCycle === "monthly" ? "₹199" : "₹1,990"}
                </span>

                <span className="text-slate-400 font-bold text-sm">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
              </div>

              {billingCycle === "yearly" && (
                <p className="text-[10px] font-black text-[#9BCB3B] tracking-widest mt-3">
                  ₹165 per month, billed annually
                </p>
              )}

              <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed">
                For freelancers and agencies managing more clients and
                offboarding work.
              </p>
            </div>

            <div className="h-px bg-slate-100 mb-7 sm:mb-8" />

            <p className="text-[10px] font-black tracking-[0.2em] text-[#243F74] mb-4">
              EVERYTHING IN FREE, PLUS
            </p>

            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow">

              {[
                "Unlimited clients",
                "Automated email reminders",
                "Automated reminder sequence",
                "Task assignments",
                "Team member responsibility",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 font-bold"
                >
                  <span className="text-[#9BCB3B] font-black shrink-0 mt-0.5">
                    ✓
                  </span>

                  <span>{feature}</span>
                </li>
              ))}

            </ul>

            {/* =========================
                PRO ACTION
            ========================== */}
            <div className="space-y-3">

              {!isPro ? (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  style={{ backgroundColor: "#243F74" }}
                  className="w-full py-4 sm:py-5 rounded-2xl text-white font-black text-xs tracking-[0.15em] shadow-xl shadow-[#243F74]/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>

                  {user ? "Upgrade to Pro" : "Get Pro"}
                </button>
              ) : (
                <div className="flex flex-col gap-3">

                  <div className="w-full py-4 sm:py-5 rounded-2xl bg-[#9BCB3B]/10 text-[#6d941f] border border-[#9BCB3B]/20 text-center font-black text-xs tracking-widest flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293 6.293 10.707l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>

                    Pro Plan Active
                  </div>

                  <Link
                    href="/dashboard"
                    style={{ backgroundColor: "#243F74" }}
                    className="w-full py-4 rounded-2xl text-white text-center font-black text-xs tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-lg"
                  >
                    Go to Dashboard →
                  </Link>

                </div>
              )}

              <p className="text-[9px] text-slate-400 font-bold tracking-widest text-center mt-4">
                Secure payment via Razorpay
              </p>

            </div>
          </div>
        </div>

        {/* =========================
            BOTTOM NOTE
        ========================== */}
        <div className="max-w-3xl mx-auto mt-12 sm:mt-16 md:mt-20">

          <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50/50 p-5 sm:p-7 text-center">

            <p className="text-sm font-bold text-[#243F74] mb-2">
              Start free. Upgrade when you need more.
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The Free plan gives you the complete core offboarding workflow.
              Pro adds unlimited clients, automated reminders, and team
              coordination.
            </p>

          </div>
        </div>

      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="border-t border-slate-100 bg-slate-50/40">

        <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-10 sm:py-12">

          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">

            <div className="text-center md:text-left">
              <Link href="/" className="inline-block mb-2">
                <Image
                  src="/logo.png"
                  alt="OffboardPro"
                  width={120}
                  height={36}
                  className="object-contain"
                />
              </Link>

              <p className="text-xs text-slate-400">
                Client offboarding for freelancers, consultants, and agencies.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">

              <Link
                href="/"
                className="text-xs font-semibold text-slate-400 hover:text-[#243F74] transition-colors"
              >
                Home
              </Link>

              <Link
                href="/privacy"
                className="text-xs font-semibold text-slate-400 hover:text-[#243F74] transition-colors"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-xs font-semibold text-slate-400 hover:text-[#243F74] transition-colors"
              >
                Terms
              </Link>

              <Link
                href="/refund-policy"
                className="text-xs font-semibold text-slate-400 hover:text-[#243F74] transition-colors"
              >
                Refund Policy
              </Link>

            </div>

          </div>

          <div className="border-t border-slate-100 mt-8 pt-6 text-center">

            <p className="text-[11px] text-slate-400">
              © 2026 OffboardPro. All rights reserved.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}