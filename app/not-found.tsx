"use client";

import Link from "next/link";
import Image from "next/image";

// Ensure the component name matches the file intent
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      {/* BRANDING */}
      <div className="mb-12">
        <Image 
          src="/logo.png" 
          alt="OffboardPro" 
          width={180} 
          height={60} 
          className="object-contain mx-auto"
          priority
        />
      </div>

      {/* ERROR MESSAGE */}
      <h1 
        style={{ color: '#243F74' }} 
        className="text-8xl md:text-9xl font-black italic tracking-tighter mb-4 opacity-10"
      >
        404
      </h1>
      
      <h2 
        style={{ color: '#243F74' }} 
        className="text-3xl md:text-4xl font-black mb-6 tracking-tight italic"
      >
        Project Not Found.
      </h2>
      
      <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
        The link you followed might be broken or the page has been moved. 
        Let's get you back to your offboarding workflow.
      </p>

      {/* CALL TO ACTION */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <button className="w-full sm:w-auto px-10 py-4 bg-slate-100 text-slate-500 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
            Home
          </button>
        </Link>
        <Link href="/dashboard">
          <button 
            style={{ backgroundColor: '#243F74' }} 
            className="w-full sm:w-auto px-10 py-4 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-[#243F74]/20 hover:scale-105 active:scale-95 transition-all"
          >
            Go to Dashboard
          </button>
        </Link>
      </div>

      <footer className="mt-20 text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
        Security First — OffboardPro
      </footer>
    </div>
  );
}