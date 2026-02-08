"use client";

import Image from "next/image";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* HERO ICON: Replacing the checkmark circle with your brand icon.png */}
        <div className="mb-10 flex justify-center">
          <div style={{ backgroundColor: '#F4F9E8' }} className="w-28 h-28 rounded-full flex items-center justify-center shadow-lg shadow-[#9BCB3B]/10 border-4 border-white">
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

        {/* Branding text removed as requested, using heading for identity */}
        <h1 style={{ color: '#243F74' }} className="text-4xl font-black tracking-tight mb-4 italic leading-tight">
          Upgrade <span style={{ color: '#9BCB3B' }}>Successful!</span>
        </h1>
        
        <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12 px-4">
          Welcome to the Pro family. You now have unlimited clients, PDF reports, and automatic email reminders unlocked.
        </p>

        <div className="space-y-4">
          <Link href="/dashboard">
            <button 
              style={{ backgroundColor: '#243F74' }}
              className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-[#243F74]/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Go to Dashboard
            </button>
          </Link>
          
          <div className="pt-4">
             <p style={{ color: '#9BCB3B' }} className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">
               OffboardPro Security
             </p>
             <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">
               A receipt has been sent to your email.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}