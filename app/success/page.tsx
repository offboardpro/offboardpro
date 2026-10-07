"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function SuccessPage() {
  useEffect(() => {
    // One-time payoff moment. The pricing page already fires confetti right
    // before navigating here, but that burst is almost certainly cut short
    // by the page change — this is the one most people will actually see.
    const timer = setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.4 },
        colors: ["#243F74", "#9BCB3B", "#ffffff"],
      });
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* HERO ICON */}
        <div className="mb-10 flex justify-center animate-scale-in">
          <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-lg shadow-brand-green/10 border-4 border-white bg-brand-green/10">
            <Image
              src="/icon.png"
              alt="OffboardPro Icon"
              width={70}
              height={70}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div
          className="animate-slide-up"
          style={{ animationDelay: "150ms" }}
        >
          <h1 className="text-brand-navy text-4xl font-black tracking-tight mb-4 italic leading-tight">
            Upgrade <span className="text-brand-green">Successful!</span>
          </h1>

          <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12 px-4">
            Welcome to the Pro family. You now have unlimited clients, PDF
            reports, and automatic email reminders unlocked.
          </p>

          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full py-5 rounded-2xl bg-brand-navy text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Go to Dashboard
            </Link>

            <div className="pt-4">
              <p className="text-brand-green text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                OffboardPro Security
              </p>
              <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">
                A receipt has been sent to your email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
