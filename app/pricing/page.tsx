"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// 1. Import Firebase Auth and Firestore
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
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
    // Check cache initially for snappier UI, but don't let it lock the state
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
            const status = docSnap.data().isPro || false;
            // Force set the actual database status
            setIsPro(status);
            localStorage.setItem("offboardpro_isPro", status.toString());
          } else {
            setIsPro(false);
          }
          setLoading(false); 
        }, (error) => {
          console.error("Pricing sync error:", error);
          setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setIsPro(false); // Reset if no user
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

    // Razorpay expects amount in paise (₹199 = 19900 paise)
    const amountInPaise = billingCycle === 'monthly' ? 19900 : 199000;

    try {
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // UPDATED: Sending full paise to API to ensure no precision loss
        body: JSON.stringify({ amount: amountInPaise, userId: user.uid }), 
      });
      
      const order = await res.json();

      if (!order.id) {
        alert("Failed to create order. Please try again.");
        return;
      }

      const options = {
        // UPDATED: Using Env variable for security instead of hardcoded string
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: "INR",
        name: "OffboardPro",
        description: `${billingCycle.toUpperCase()} Pro Subscription`,
        order_id: order.id,
        handler: async function (response: any) {
          // Trigger the robust finalize function
          await finalizeCloudUpgrade();
        },
        prefill: {
          name: user.displayName || "Freelancer",
          email: user.email || "",
        },
        theme: { color: "#243F74" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      alert("Could not start payment. Please try again.");
    }
  };

  // --- UPDATED: ROBUST FINALIZE FUNCTION ---
  const finalizeCloudUpgrade = async () => {
    setIsUpgrading(true);

    // SAFETY LOCK: Prevent user from closing tab during sync
    const preventClose = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", preventClose);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#243F74', '#9BCB3B', '#ffffff']
    });
    
    try {
        const userRef = doc(db, "users", user.uid);
        
        // Update Firestore directly
        await setDoc(userRef, { 
          isPro: true,
          plan: "Professional",
          billingCycle: billingCycle,
          upgradedAt: serverTimestamp()
        }, { merge: true });

        // Update local status for dashboard
        localStorage.setItem("offboardpro_isPro", "true");
        
        setTimeout(() => {
          // Release lock and redirect
          window.removeEventListener("beforeunload", preventClose);
          setIsUpgrading(false); 
          router.push("/success");
        }, 2500);

    } catch (error) {
        console.error("Upgrade failed:", error);
        window.removeEventListener("beforeunload", preventClose);
        setIsUpgrading(false);
        alert("Payment successful, but status update failed. Please refresh manually or contact support.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-[#243F74] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white relative font-sans selection:bg-[#9BCB3B]/20">
      {/* SUCCESS ILLUSTRATION OVERLAY */}
      {isUpgrading && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="relative w-48 h-48 mb-8">
            <div style={{ backgroundColor: '#9BCB3B' }} className="absolute inset-0 rounded-full opacity-20 animate-ping"></div>
            <div className="relative bg-white border-4 border-[#9BCB3B] w-full h-full rounded-full flex items-center justify-center shadow-2xl shadow-[#9BCB3B]/20">
              <svg className="w-20 h-20 text-[#9BCB3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 style={{ color: '#243F74' }} className="text-4xl font-black italic mb-2 tracking-tight">Welcome to Pro.</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-8">Unlocking your premium features...</p>
          
          <button 
            onClick={() => router.push("/success")}
            style={{ backgroundColor: '#243F74' }}
            className="px-10 py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-xl animate-pulse hover:scale-105 transition-all"
          >
            Finalizing your account...
          </button>
        </div>
      )}

      {/* HEADER WITH PRO STATUS */}
      <nav className="px-6 md:px-10 py-8 max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center transition-transform hover:scale-105">
          <Image src="/logo.png" alt="OffboardPro" width={140} height={45} className="object-contain" priority />
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden xs:flex flex-col items-end text-right">
            <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">Status</span>
            <span style={{ color: isPro ? '#9BCB3B' : '#243F74' }} className="text-[10px] font-black uppercase tracking-widest italic">
              {isPro ? "✓ Pro Member" : "Free Plan"}
            </span>
          </div>
          <Link href="/dashboard" className="text-slate-400 font-bold text-sm hover:text-[#243F74] transition-colors italic border-l pl-4 md:pl-6 border-slate-100">
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto pt-8 md:pt-16 pb-32 px-6">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 style={{ color: '#243F74' }} className="text-4xl md:text-6xl font-black tracking-tight mb-6 italic leading-tight">
            {isPro ? "You're an " : "Professional "}
            <span style={{ color: '#9BCB3B' }}>{isPro ? "OffboardPro." : "Security."}</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-lg font-medium max-w-2xl mx-auto">
            Choose the plan that fits your freelance scale. Upgrade or downgrade anytime.
          </p>
          
          {/* BILLING TOGGLE */}
          <div className="flex items-center justify-center gap-4 mt-12 bg-slate-50 w-fit mx-auto p-2 rounded-full border border-slate-100">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-[#243F74] shadow-sm' : 'text-slate-400'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white text-[#243F74] shadow-sm' : 'text-slate-400'}`}
            >
              Yearly
              <span className="bg-[#9BCB3B] text-white text-[8px] px-2 py-0.5 rounded-full animate-pulse tracking-tighter">Save 15%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className={`border border-slate-100 p-8 md:p-12 rounded-[2.5rem] flex flex-col bg-slate-50/50 transition-all duration-500 hover:shadow-xl ${isPro ? 'opacity-40' : 'opacity-100 translate-y-0'}`}>
            <h3 className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] mb-4">Starter</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span style={{ color: '#243F74' }} className="text-5xl md:text-6xl font-black italic">₹0</span>
              <span className="text-slate-400 font-bold text-sm">/forever</span>
            </div>
            <ul className="space-y-5 mb-12 flex-grow">
              <li className="flex items-center gap-3 text-slate-500 font-bold text-sm"><span className="text-[#9BCB3B] font-black">✓</span> 3 Active Clients</li>
              <li className="flex items-center gap-3 text-slate-300 font-bold text-sm line-through italic"><span className="text-slate-200">✗</span> Unlimited Projects</li>
              <li className="flex items-center gap-3 text-slate-300 font-bold text-sm line-through italic"><span className="text-slate-200">✗</span> PDF Exporting</li>
            </ul>
            <button disabled className="w-full py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest text-center cursor-not-allowed">
              {isPro ? "Previous Plan" : "Current Plan"}
            </button>
          </div>

          {/* Pro Plan */}
          <div style={{ borderColor: '#9BCB3B' }} className="border-2 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#9BCB3B]/10 flex flex-col relative bg-white overflow-hidden transition-all duration-500 hover:-translate-y-2">
            {!isPro && (
              <div style={{ backgroundColor: '#9BCB3B' }} className="absolute top-0 right-0 px-6 py-2 text-white text-[10px] font-black uppercase rounded-bl-[1.5rem] tracking-widest">
                Recommended
              </div>
            )}
            <h3 className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] mb-4">Professional</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span style={{ color: '#243F74' }} className="text-5xl md:text-6xl font-black italic">
                {billingCycle === 'monthly' ? '₹199' : '₹1,990'}
              </span>
              <span className="text-slate-400 font-bold text-sm">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            {billingCycle === 'yearly' && (
              <p className="text-[10px] font-black text-[#9BCB3B] uppercase tracking-widest mb-6">₹165 per month, billed annually</p>
            )}

            <ul className="space-y-5 mb-12 flex-grow mt-4">
              <li className="flex items-center gap-3 text-slate-700 font-bold text-sm"><span className="text-[#9BCB3B] font-black">✓</span> Unlimited Clients</li>
              <li className="flex items-center gap-3 text-slate-700 font-bold text-sm"><span className="text-[#9BCB3B] font-black">✓</span> Priority Email Alerts</li>
              <li className="flex items-center gap-3 text-slate-700 font-bold text-sm"><span className="text-[#9BCB3B] font-black">✓</span> PDF Export Reports</li>
              <li className="flex items-center gap-3 text-slate-700 font-bold text-sm"><span className="text-[#9BCB3B] font-black">✓</span> Sharable Client Portals</li>
            </ul>

            {/* THE FIX: Button logic checks isPro state explicitly */}
            {isPro ? (
              <button onClick={() => router.push('/dashboard')} style={{ backgroundColor: '#243F74' }} className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                Go to Dashboard
              </button>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={handleUpgrade} 
                  style={{ backgroundColor: '#243F74' }} 
                  className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#243F74]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Upgrade to Pro Now
                </button>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4">
                  Secure Payment via Razorpay
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-20 text-center">
            <p className="text-slate-400 text-xs font-bold mb-4 uppercase tracking-widest">Trusted by 2,000+ Freelancers</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale">
                <span className="font-black italic text-[#243F74]">SLACK</span>
                <span className="font-black italic text-[#243F74]">ASANA</span>
                <span className="font-black italic text-[#243F74]">NOTION</span>
                <span className="font-black italic text-[#243F74]">AWS</span>
            </div>
        </div>
      </section>

      <footer className="text-center py-12 border-t border-slate-50 bg-slate-50/30">
        <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest italic mb-2">
          Secure Payments via Razorpay
        </p>
        <p className="text-slate-300 text-[9px] font-bold uppercase tracking-tighter">
          &copy; 2026 OffboardPro — All Rights Reserved
        </p>
      </footer>
    </div>
  );
}