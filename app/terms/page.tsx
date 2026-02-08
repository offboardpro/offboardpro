"use client";

import Link from "next/link";
import Image from "next/image";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#9BCB3B]/20">
      {/* HEADER / NAVIGATION */}
      <nav className="border-b border-slate-50 px-6 md:px-10 py-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="transition-transform hover:scale-105">
          <Image src="/logo.png" alt="OffboardPro" width={140} height={40} className="object-contain" priority />
        </Link>
        <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#243F74] transition-colors">
          Back to Home
        </Link>
      </nav>

      {/* MAIN CONTENT */}
      {/* Added smooth entrance animation and optimized vertical padding */}
      <main className="max-w-3xl mx-auto py-16 md:py-24 px-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <h1 style={{ color: '#243F74' }} className="text-4xl md:text-6xl font-black italic mb-4 tracking-tighter leading-tight">
          Terms of Service
        </h1>
        <p className="text-[#9BCB3B] mb-12 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-8 h-[2px] bg-[#9BCB3B]"></span>
          Last Updated: January 2026
        </p>

        <div className="space-y-12 text-slate-600 leading-relaxed">
          <section className="group">
            <h2 style={{ color: '#243F74' }} className="text-[11px] font-black uppercase tracking-[0.25em] mb-5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#9BCB3B] transition-colors"></span>
              1. Acceptance of Terms
            </h2>
            <p className="font-medium text-base md:text-lg">
              By accessing OffboardPro, you agree to be bound by these terms. We provide a professional tracking layer for freelancers; however, the manual execution of offboarding remains your professional responsibility.
            </p>
          </section>

          <section className="group">
            <h2 style={{ color: '#243F74' }} className="text-[11px] font-black uppercase tracking-[0.25em] mb-5 flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#9BCB3B] transition-colors"></span>
               2. User Responsibility
            </h2>
            <p className="font-medium text-base md:text-lg">
              You understand that OffboardPro <strong className="text-slate-900 font-black">does not automatically revoke access</strong> to third-party tools. Our service acts as a checklist and reminder system. You are solely responsible for manually removing your credentials from client systems.
            </p>
          </section>

          <section className="group">
            <h2 style={{ color: '#243F74' }} className="text-[11px] font-black uppercase tracking-[0.25em] mb-5 flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#9BCB3B] transition-colors"></span>
               3. Limitation of Liability
            </h2>
            <p className="font-medium text-base md:text-lg">
              OffboardPro shall not be held liable for any data breaches, unauthorized access, or security incidents occurring on client systems, even if tracked within our platform.
            </p>
          </section>

          <section className="group">
            <h2 style={{ color: '#243F74' }} className="text-[11px] font-black uppercase tracking-[0.25em] mb-5 flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#9BCB3B] transition-colors"></span>
               4. Subscriptions & Billing
            </h2>
            <p className="font-medium text-base md:text-lg">
              Pro subscriptions provide unlimited project tracking and advanced features. Payments are processed securely via our third-party providers. You may cancel your subscription at any time.
            </p>
          </section>

          <section className="pt-12 border-t border-slate-100 flex flex-col gap-4">
            <p className="text-sm font-bold text-slate-400 italic leading-relaxed">
              Failure to follow proper offboarding procedures can lead to security risks. Always verify removal manually.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
                <a href="mailto:offboardpro@gmail.com" className="bg-slate-50 text-[#243F74] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#9BCB3B] hover:text-white transition-all w-fit shadow-sm">
                Contact Support
                </a>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER STRIP */}
      <footer className="py-16 bg-slate-50 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          &copy; 2026 OffboardPro — Professional Exit Guaranteed
        </p>
      </footer>
    </div>
  );
}