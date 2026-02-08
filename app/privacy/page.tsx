"use client";

import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicy() {
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
      {/* Added smooth entrance animation classes here */}
      <main className="max-w-3xl mx-auto py-16 md:py-24 px-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <h1 style={{ color: '#243F74' }} className="text-4xl md:text-6xl font-black italic mb-4 tracking-tighter leading-tight">
          Privacy Policy
        </h1>
        <p className="text-[#9BCB3B] mb-12 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-8 h-[2px] bg-[#9BCB3B]"></span>
          Last Updated: January 2026
        </p>

        <div className="space-y-12 text-slate-600 leading-relaxed">
          <section className="group">
            <h2 style={{ color: '#243F74' }} className="text-[11px] font-black uppercase tracking-[0.25em] mb-5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#9BCB3B] transition-colors"></span>
              1. Data Collection
            </h2>
            <p className="font-medium text-base md:text-lg">
              OffboardPro follows a <strong className="text-slate-900 font-black">Zero-Password Policy</strong>. We do not ask for, store, or transmit your client's credentials or passwords. We only collect your account name, email, and the names of the tools you manually enter for tracking purposes.
            </p>
          </section>

          <section className="group">
            <h2 style={{ color: '#243F74' }} className="text-[11px] font-black uppercase tracking-[0.25em] mb-5 flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#9BCB3B] transition-colors"></span>
               2. Data Usage
            </h2>
            <p className="font-medium text-base md:text-lg">
              Your data is used solely to provide the offboarding tracking service. We do not sell your personal information or your client lists to third parties. We believe your professional data should remain yours.
            </p>
          </section>

          <section className="group">
            <h2 style={{ color: '#243F74' }} className="text-[11px] font-black uppercase tracking-[0.25em] mb-5 flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#9BCB3B] transition-colors"></span>
               3. Security Standards
            </h2>
            <p className="font-medium text-base md:text-lg">
              We use industry-standard encryption to protect your account information. As a tracking layer, the actual security of client accounts remains your responsibility within those respective platforms.
            </p>
          </section>

          <section className="pt-12 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Questions about your data? 
            </p>
            <a href="mailto:offboardpro@gmail.com" className="bg-slate-50 text-[#243F74] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#9BCB3B] hover:text-white transition-all w-fit shadow-sm">
              Email Support
            </a>
          </section>
        </div>
      </main>

      {/* FOOTER STRIP */}
      <footer className="py-16 bg-slate-50 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          &copy; 2026 OffboardPro — Security First
        </p>
      </footer>
    </div>
  );
}