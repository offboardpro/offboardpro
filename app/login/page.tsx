"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// 1. Import Firebase Auth and your config
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Real Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Added .trim() and .toLowerCase() to ensure the email format is perfect 
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      // UPDATED: Redirect to Home instead of Dashboard
      router.push("/");
    } catch (error: any) {
      console.error("Firebase Auth Error Code:", error.code);
      console.error("Firebase Auth Error Message:", error.message);
      
      if (error.code === "auth/invalid-credential") {
        alert("Invalid email or password. If you originally signed up with Google, please use the 'Continue with Google' button.");
      } else if (error.code === "auth/user-not-found") {
        alert("No account found with this email. Please sign up first.");
      } else {
        alert("Login failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Real Google Login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // UPDATED: Redirect to Home instead of Dashboard
      router.push("/");
    } catch (error: any) {
      console.error("Google Login Error:", error.code);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white font-sans selection:bg-[#9BCB3B]/20">
      {/* Left Side: Branded High-Contrast Panel (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-50 border-r border-slate-100 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9BCB3B]/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
        
        <Link href="/" className="flex items-center relative z-10">
          <Image 
            src="/logo.png" 
            alt="OffboardPro" 
            width={180} 
            height={60} 
            className="object-contain" 
            priority
          />
        </Link>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-6 duration-700">
          <h2 style={{ color: '#243F74' }} className="text-5xl md:text-6xl font-black leading-tight mb-6 tracking-tighter italic">
            Secure your <br /> 
            <span style={{ color: '#9BCB3B' }}>freelance exit.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-md leading-relaxed font-medium">
            Join 2,000+ freelancers who use OffboardPro to manage client transitions with total confidence and security.
          </p>
        </div>

        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] relative z-10">
          &copy; 2026 OffboardPro — Security First
        </div>
      </div>

      {/* Right Side: Login Form (Fully Responsive) */}
      <div className="flex items-center justify-center p-6 md:p-16 bg-white relative">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          
          {/* Mobile Logo & Brand Indicator */}
          <div className="mb-12 lg:hidden flex flex-col items-center">
             <Image 
                src="/logo.png" 
                alt="Logo" 
                width={140} 
                height={50} 
                className="mb-4 object-contain" 
             />
             <div className="h-1 w-10 bg-[#9BCB3B] rounded-full" />
          </div>

          <h1 style={{ color: '#243F74' }} className="text-4xl font-black tracking-tight mb-2 italic">Welcome back</h1>
          <p className="text-slate-400 font-medium mb-10 text-sm md:text-base">Enter your details to access your dashboard.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* REAL GOOGLE LOGIN BUTTON */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-4 px-6 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-[0.98] shadow-sm group"
            >
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" 
                alt="Google" 
                className="w-5 h-5 object-contain group-hover:rotate-12 transition-transform" 
              />
              Continue with Google
            </button>

            <div className="relative py-2 flex items-center gap-4">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">or use email</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="space-y-4">
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
                        placeholder="••••••••" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-700 outline-none focus:border-[#9BCB3B] focus:bg-white transition-all font-bold placeholder:text-slate-300 shadow-inner" 
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer group">
                <input type="checkbox" style={{ accentColor: '#9BCB3B' }} className="w-4 h-4 rounded-md border-slate-200" /> 
                <span className="group-hover:text-slate-600 transition-colors">Remember me</span>
              </label>
              <button type="button" style={{ color: '#9BCB3B' }} className="hover:text-[#243F74] transition-colors">Forgot password?</button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#243F74' }}
              className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#243F74]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-12 text-sm font-bold text-slate-400">
            Don't have an account? <Link href="/signup" style={{ color: '#9BCB3B' }} className="hover:text-[#243F74] transition-colors font-black ml-1">Create one for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}