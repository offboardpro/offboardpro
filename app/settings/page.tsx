"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function SettingsPage() {
  const [userName, setUserName] = useState("Freelancer");
  const [email, setEmail] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("offboardpro_user") || "Freelancer";
    const savedEmail = localStorage.getItem("offboardpro_email") || "";
    const proStatus = localStorage.getItem("offboardpro_isPro") === "true";
    
    setUserName(savedName);
    setEmail(savedEmail);
    setIsPro(proStatus);
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    localStorage.setItem("offboardpro_user", userName);
    localStorage.setItem("offboardpro_email", email);
    
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-[#9BCB3B] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
          ✓ Settings Saved
        </div>
      )}

      <nav className="bg-white border-b border-slate-100 px-6 py-6 flex justify-between items-center sticky top-0 z-40">
        <Link href="/dashboard" className="font-black text-[#243F74] italic text-xl">
          Offboard<span className="text-[#9BCB3B]">Pro</span>
        </Link>
        <Link href="/dashboard" className="text-[10px] font-black uppercase text-slate-400">
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto py-16 px-6">
        <h1 className="text-4xl font-black italic mb-10 text-[#243F74]">
          Account <span className="text-[#9BCB3B]">Settings</span>
        </h1>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Name</label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-[#9BCB3B] transition-all text-slate-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-2">Reminder Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. reminders@yourdomain.com"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-[#9BCB3B] transition-all text-slate-700"
            />
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="mt-6 w-full md:w-auto px-10 py-4 bg-[#243F74] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#243F74]/20 hover:scale-[1.02] transition-all"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </main>
    </div>
  );
}