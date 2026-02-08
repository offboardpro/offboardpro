"use client";

import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

export default function SharedProjectPage({ params }: { params: Promise<{ id: string }> }) {
  // We use "use" to unwrap params in the latest Next.js versions
  const resolvedParams = use(params);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      try {
        const docRef = doc(db, "clients", resolvedParams.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching shared project:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#9BCB3B] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <h1 className="text-4xl font-black text-[#243F74] mb-4 italic">Link Expired</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">This security portal is no longer active.</p>
        <Link href="/" className="bg-[#243F74] text-white px-8 py-3 rounded-xl font-black text-xs uppercase">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-20 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-t-8 border-[#9BCB3B] animate-in fade-in zoom-in duration-500">
        <div className="flex justify-between items-start mb-10">
          <Image src="/logo.png" alt="OffboardPro" width={130} height={40} className="object-contain" priority />
          <span className="bg-[#9BCB3B]/10 text-[#9BCB3B] text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-[#9BCB3B]/20">
            Verified Report
          </span>
        </div>
        
        <h1 className="text-4xl font-black italic text-[#243F74] mb-2">Security Handoff</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">Client Identity: {project.name}</p>

        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Revocation Checklist</h3>
            <p className="text-lg font-bold text-[#243F74]">{project.tools}</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Completion Date</h3>
            <p className="text-lg font-bold text-[#9BCB3B]">{project.date}</p>
          </div>

          {project.notes && (
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Security Handover Notes</h3>
              <p className="text-slate-600 italic text-sm leading-relaxed">{project.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Powered by OffboardPro</p>
          <p className="text-[8px] font-bold text-slate-400">© 2026 — Secure Client Offboarding Solutions</p>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        This is a read-only security document
      </p>
    </div>
  );
}