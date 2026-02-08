"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// 1. Import Firebase Auth and your config
import { auth } from "@/lib/firebase"; 
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Real Email/Password Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      
      // Save the user's Display Name in Firebase
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // UPDATED: Redirect to Home instead of Dashboard
      router.push("/");
    } catch (error: any) {
      console.error(error);
      alert(error.message); 
    } finally {
      setLoading(false);
    }
  };

  // 3. Real Google Sign Up
  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // UPDATED: Redirect to Home instead of Dashboard
      router.push("/");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white font-sans selection:bg-[#9BCB3B]/20">
      {/* Left Side: Branded Panel (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-50 border-r border-slate-100 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9BCB3B]/10 rounded-full -ml-48 -mb-48 blur-3xl animate-pulse" />
        
        <Link href="/" className="relative z-10">
          <Image src="/logo.png" alt="OffboardPro" width={180} height={60} className="object-contain" priority />
        </Link>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-6 duration-700">
          <h2 style={{ color: '#243F74' }} className="text-5xl md:text-6xl font-black leading-tight mb-6 tracking-tighter italic">
            Start your <br /> 
            <span style={{ color: '#9BCB3B' }}>secure journey.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-md leading-relaxed font-medium">
            Join thousands of freelancers who prioritize client security and professional offboarding.
          </p>
        </div>

        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] relative z-10">
          &copy; 2026 OffboardPro — Join the Pro Family
        </div>
      </div>

      {/* Right Side: Sign Up Form (Responsive) */}
      <div className="flex items-center justify-center p-6 md:p-16 bg-white relative">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          
          {/* Mobile Logo Indicator */}
          <div className="mb-12 lg:hidden flex flex-col items-center">
             <Image 
                src="/logo.png" 
                alt="Logo" 
                width={130} 
                height={40} 
                className="mb-4 object-contain" 
             />
             <div className="h-1 w-10 bg-[#9BCB3B] rounded-full" />
          </div>

          <h1 style={{ color: '#243F74' }} className="text-4xl font-black tracking-tight mb-2 italic text-center md:text-left">Create Account</h1>
          <p className="text-slate-400 font-medium mb-10 text-center md:text-left text-sm md:text-base">Get started for free today.</p>

          <form onSubmit={handleSignUp} className="space-y-6">
            {/* GOOGLE SIGN UP */}
            <button 
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full py-4 px-6 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-[0.98] shadow-sm group"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5 object-contain group-hover:rotate-12 transition-transform" />
              Sign up with Google
            </button>

            <div className="relative py-2 flex items-center gap-4">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">or use email</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-700 outline-none focus:border-[#9BCB3B] focus:bg-white transition-all font-bold placeholder:text-slate-300 shadow-inner" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-700 outline-none focus:border-[#9BCB3B] focus:bg-white transition-all font-bold placeholder:text-slate-300 shadow-inner" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-700 outline-none focus:border-[#9BCB3B] focus:bg-white transition-all font-bold placeholder:text-slate-300 shadow-inner" 
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#243F74' }}
              className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#243F74]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Free Account"}
            </button>
          </form>

          <p className="text-center mt-12 text-sm font-bold text-slate-400">
            Already have an account? <Link href="/login" style={{ color: '#9BCB3B' }} className="hover:text-[#243F74] transition-colors font-black ml-1">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}