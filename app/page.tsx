"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

// --- ANIMATION WRAPPER COMPONENT ---
function Reveal({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 } 
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1200ms] delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 -translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null); 
  const [isPro, setIsPro] = useState(false); 
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const unsubPro = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setIsPro(docSnap.data().isPro || false);
          }
        });
        return () => unsubPro();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const navLinks = [
    { name: "How it works", href: "#how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "Security", href: "#security" },
    { name: "FAQs", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/90 backdrop-blur-md border-b border-slate-50 px-6 md:px-10 py-4 md:py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="w-[100px] md:w-[140px] flex items-center justify-start">
          <Link href="/">
            <Image 
              src="/logo.png" 
              alt="OffboardPro" 
              width={140}  
              height={140} 
              priority
              unoptimized
              className="object-contain scale-[1.1] md:scale-[1.8] transition-transform" 
            />
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-10 text-sm font-bold text-slate-400">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="hover:text-[#243F74] transition-colors">
              {link.name}
            </Link>
          ))}
          
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-6 animate-in fade-in duration-500">
                <Link 
                  href="/dashboard" 
                  style={{ backgroundColor: '#9BCB3B' }}
                  className="text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-[#9BCB3B]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Go to Dashboard
                </Link>
                <div className="flex items-center gap-3 pl-6 border-l border-slate-100 group relative cursor-pointer">
                  <div className="text-right hidden sm:block text-slate-600">
                      <p style={{ color: isPro ? '#9BCB3B' : '#243F74' }} className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                          {isPro ? "Pro Member" : "Free Plan"}
                      </p>
                      <p className="text-slate-400 text-xs font-bold leading-tight">Hi, {user.displayName?.split(' ')[0] || "User"}</p>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-full border-2 border-[#9BCB3B] object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#243F74] text-white flex items-center justify-center font-black text-xs italic border-2 border-[#9BCB3B]">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="absolute -bottom-12 right-0 bg-white border border-slate-100 py-2 px-4 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-red-500 text-xs font-black uppercase tracking-widest"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-10 animate-in fade-in duration-500">
                <Link href="/login" className="hover:text-[#243F74] transition-colors">Login</Link>
                <Link 
                  href="/signup" 
                  style={{ backgroundColor: '#243F74' }}
                  className="text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-[#243F74]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Get started
                </Link>
              </div>
            )
          )}
        </nav>

        <button onClick={toggleMenu} className="lg:hidden flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 relative z-[110]">
          <div className={`w-5 h-0.5 bg-[#243F74] transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}></div>
          <div className={`w-5 h-0.5 bg-[#243F74] transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`}></div>
          <div className={`w-5 h-0.5 bg-[#243F74] transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></div>
        </button>
      </div>

      <div className={`absolute top-[95%] left-6 right-6 lg:hidden transition-all duration-300 ease-out origin-top ${isMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"}`}>
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                onClick={toggleMenu} 
                href={link.href} 
                className="text-[#243F74] font-black text-lg italic p-3 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="h-px bg-slate-100 w-full my-1" />
          {!authLoading && (
            user ? (
              <div className="flex flex-col gap-3">
                <Link 
                  onClick={toggleMenu} 
                  href="/dashboard" 
                  className="w-full text-center py-4 rounded-xl bg-[#9BCB3B] text-white font-black shadow-lg shadow-[#9BCB3B]/20"
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-red-500 font-black uppercase tracking-widest text-[10px] text-center">Logout Account</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link onClick={toggleMenu} href="/signup" className="w-full text-center py-4 rounded-xl bg-[#243F74] text-white font-black shadow-lg shadow-[#243F74]/20">Get Started</Link>
                <Link onClick={toggleMenu} href="/login" className="w-full text-center py-4 rounded-xl border-2 border-slate-50 text-[#243F74] font-black">Login</Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-4 md:py-6 transition-all">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left group">
        <span style={{ color: '#243F74' }} className="text-lg font-bold italic group-hover:text-[#9BCB3B] transition-colors">{question}</span>
        <span className={`text-2xl transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} style={{ color: '#9BCB3B' }}>+</span>
      </button>
      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-slate-500 text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setShowScrollBtn(window.scrollY > 400);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubscribe();
    };
  }, []);

  const goToPricing = () => router.push("/pricing");
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const marqueeItems = ["Freelancers", "Consultants", "Agencies"];

  return (
    <div className="min-h-screen bg-white scroll-smooth relative font-sans selection:bg-[#9BCB3B] selection:text-white">
      <Header />
      
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 20s linear infinite;
        }
      `}</style>

      <button 
        onClick={scrollToTop}
        style={{ 
          backgroundColor: '#243F74',
          opacity: showScrollBtn ? 1 : 0,
          pointerEvents: showScrollBtn ? 'auto' : 'none',
          transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        className="fixed bottom-8 right-8 z-[150] p-4 rounded-full text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      
      <main className="overflow-x-clip">
        {/* HERO SECTION - REPLACED WITH NEW COPY */}
        <section className="max-w-6xl mx-auto text-center pt-8 md:pt-24 pb-8 md:pb-12 px-6">
          <h1 
            style={{ 
              color: '#9BCB3B',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(-20px)', 
              transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1)' 
            }}
            className="text-4xl md:text-7xl font-black tracking-tight leading-tight md:leading-[1.05] mb-6 md:mb-8"
          >
            Client Offboarding Checklist <br /> for Freelancers & Agencies
          </h1>
          
          <p 
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s' 
            }}
            className="text-slate-500 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium mb-10 md:mb-12 px-2"
          >
            Track every client tool, permission, and access — so you never leave accounts exposed after a project ends.
          </p>

          <div 
            className="mt-6 md:mt-12 mb-16 md:mb-24 flex flex-col items-center gap-4 min-h-[80px]" 
          >
            {!authLoading && (
              <div className="animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center">
                <Link href={user ? "/dashboard" : "/signup"}>
                  <button 
                    style={{ backgroundColor: '#243F74' }} 
                    className="text-white px-10 md:px-16 py-4 md:py-5 rounded-full text-lg md:text-xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#243F74]/20 active:scale-95 group overflow-hidden relative"
                  >
                    <span className="relative z-10">{user ? "Go to Dashboard" : "Start Clean Offboarding"}</span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </button>
                </Link>
                <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest mt-6 italic">
                  Used by freelancers & agencies who want clean professional client handovers.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* TRUSTED BY MARQUEE SECTION */}
        <div className="pb-16 md:pb-32 overflow-hidden">
          <p className="text-center text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-8 md:mb-12 italic">
            Trusted by modern professionals
          </p>
          <div className="relative flex items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-12 md:gap-24">
              {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
                <span 
                  key={i} 
                  className="text-[#243F74]/15 text-4xl md:text-7xl font-black italic tracking-tighter transition-colors cursor-default hover:text-[#9BCB3B]/30"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION: HOW IT WORKS - UPDATED WITH NEW LABELS */}
        <Reveal>
        <div id="how-it-works" className="py-12 md:py-24 border-t border-slate-50 scroll-mt-24 text-left">
          <div className="max-w-6xl mx-auto px-6">
            <h2 style={{ color: '#243F74' }} className="text-3xl md:text-4xl font-black tracking-tight mb-10 md:mb-20 text-center italic">How OffboardPro Works</h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {[
                { n: 1, t: "Create Client Access Record", d: "Track every tool, permission, and folder used during your project lifecycle." },
                { n: 2, t: "Schedule Access Review", d: "Choose a hard date to review or remove access once the final invoice is cleared." },
                { n: 3, t: "Never Miss Access Removal", d: "Get precise reminders of what needs to be revoked so accounts stay secure." }
              ].map((step) => (
                <div 
                  key={step.n} 
                  className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-50 hover:border-[#9BCB3B]/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
                >
                  <span style={{ backgroundColor: '#9BCB3B' }} className="text-white w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl font-black mb-6 md:mb-8 italic shadow-lg shadow-[#9BCB3B]/20 group-hover:rotate-12 transition-transform">{step.n}</span>
                  <h3 style={{ color: '#243F74' }} className="text-xl md:text-2xl font-black mb-4">{step.t}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Reveal>

        <Reveal>
        <div id="security" className="py-16 md:py-32 bg-slate-50/50 rounded-[3rem] md:rounded-[4rem] scroll-mt-24 text-left px-6 mx-4">
          <div className="max-w-4xl mx-auto">
            <h2 style={{ color: '#243F74' }} className="text-3xl md:text-4xl font-black tracking-tight mb-12 md:mb-16 text-center italic">Security is our priority</h2>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 text-left">
              <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow duration-500">
                <h4 style={{ color: '#243F74' }} className="font-black mb-4 uppercase text-xs tracking-widest">Zero-Password Policy</h4>
                <p className="text-slate-500 text-sm leading-relaxed">We never ask for credentials. We simply act as a tracking layer for your offboarding process.</p>
              </div>
              <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow duration-500">
                <h4 style={{ color: '#243F74' }} className="font-black mb-4 uppercase text-xs tracking-widest">End-to-End Tracking</h4>
                <p className="text-slate-500 text-sm leading-relaxed">Every removal action is logged, providing a clean audit trail to show your clients.</p>
              </div>
            </div>
          </div>
        </div>
        </Reveal>

        {/* SECTION: PROBLEM - REPLACED WITH NEW "PAINKILLER" COPY */}
        <Reveal>
        <div className="py-16 md:py-32 text-left px-6 max-w-5xl mx-auto">
           <div className="bg-slate-900 text-white p-10 md:p-20 rounded-[3rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#9BCB3B]/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              
              <h2 className="text-[#9BCB3B] text-3xl md:text-4xl font-black mb-8 italic text-center md:text-left">Forgotten Client Access = Hidden Risk</h2>
              
              <p className="text-slate-300 text-lg md:text-xl font-bold mb-10 leading-relaxed text-center md:text-left">
                After a project ends, old logins and permissions often stay active.
              </p>

              <div className="space-y-6 mb-12">
                <p className="text-slate-400 font-medium text-center md:text-left">This can lead to:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Still having access to client tools",
                    "Clients still having access to your tools",
                    "Security or privacy concerns",
                    "Awkward messages months later",
                    "Looking unprofessional"
                  ].map((q, i) => (
                    <div key={i} className="flex gap-3 items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                      <span className="text-lg">🚨</span>
                      <p className="text-sm font-bold italic text-slate-200 leading-snug">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10 w-full mb-10" />

              <div className="bg-[#9BCB3B]/10 border border-[#9BCB3B]/20 p-6 md:p-8 rounded-3xl">
                <p className="text-white text-lg font-black mb-4 italic leading-snug text-center md:text-left">OffboardPro helps ensure every project ends cleanly and professionally.</p>
                <p className="text-slate-300 text-sm font-medium leading-relaxed text-center md:text-left">
                  Ending a project cleanly protects both you and your client. <br className="hidden md:block" />
                  <strong>Our checklist system handles the oversight so you can focus on the next big project.</strong>
                </p>
              </div>
           </div>
        </div>
        </Reveal>

        {/* SECTION: Who is OffboardPro for? */}
        <Reveal>
        <div className="py-16 md:py-32 text-left px-6 max-w-5xl mx-auto scroll-mt-24">
          <h2 style={{ color: '#243F74' }} className="text-3xl md:text-5xl font-black tracking-tight mb-12 md:mb-16 text-center italic">Who is OffboardPro for?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-16">
            {[
              "Freelancers managing multiple clients",
              "Web developers & designers",
              "Marketers & SEO specialists",
              "Consultants & independent professionals",
              "Agencies"
            ].map((role, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex items-center gap-4 hover:border-[#9BCB3B]/30 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                <div className="w-8 h-8 rounded-full bg-[#243F74] text-white flex items-center justify-center shrink-0 group-hover:bg-[#9BCB3B] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-[#243F74] font-bold text-sm leading-tight">{role}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center bg-[#243F74] p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] shadow-xl">
            <p className="text-white text-xl md:text-2xl font-bold mb-0 leading-relaxed italic">
              If you access client tools or accounts, <br className="hidden md:block" />
              <span className="text-[#9BCB3B]">OffboardPro helps you stay organized and exit projects cleanly.</span>
            </p>
          </div>
        </div>
        </Reveal>

        {/* SECTION: FAQ */}
        <Reveal>
        <section id="faq" className="py-16 md:py-32 scroll-mt-24 text-left px-6">
          <div className="max-w-3xl mx-auto">
            <h2 style={{ color: '#243F74' }} className="text-3xl md:text-4xl font-black tracking-tight mb-10 md:mb-16 text-center italic">Common Questions</h2>
            <div className="space-y-1">
              <FAQItem question="Do you store my client's passwords?" answer="No. We never ask for or store passwords. We track tool names and dates for manual removal." />
              <FAQItem question="What are Smart Dashboard Alerts?" answer="Pro users see real-time visual warnings on their dashboard when an offboarding task is approaching or overdue." />
              <FAQItem question="Can I export my data?" answer="Yes! Pro users can export professional PDF reports as a record of security compliance." />
              <FAQItem question="Can I manage multiple projects at once?" answer="Absolutely. The dashboard is designed to help you track as many active offboardings as you need." />
            </div>
          </div>
        </section>
        </Reveal>

        {/* SECTION: Pricing */}
        <Reveal>
        <div id="pricing" className="py-16 md:py-32 border-t border-slate-50 bg-slate-50/30 text-left px-6 scroll-mt-24 rounded-[3rem] md:rounded-[4rem]">
          <div className="max-w-5xl mx-auto">
            <h2 style={{ color: '#243F74' }} className="text-3xl md:text-4xl font-black tracking-tight mb-12 md:mb-20 text-center italic">Simple Pricing</h2>
            <div className="grid md:grid-cols-2 gap-8 md:gap-10">
              <div className="bg-white p-10 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] text-center shadow-sm border border-slate-100 hover:scale-[1.02] transition-transform duration-500">
                <h3 className="text-slate-400 font-bold uppercase text-xs mb-6 tracking-widest">Starter</h3>
                <div style={{ color: '#243F74' }} className="text-5xl md:text-6xl font-black mb-8 italic">₹0</div>
                <ul className="space-y-4 md:space-y-5 mb-10 md:mb-12 text-slate-500 text-sm font-bold">
                  <li className="flex items-center justify-center gap-2"><svg className="w-4 h-4 text-[#9BCB3B]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Up to 3 active clients</li>
                  <li className="flex items-center justify-center gap-2"><svg className="w-4 h-4 text-[#9BCB3B]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Dashboard tracking</li>
                  <li className="flex items-center justify-center gap-2"><svg className="w-4 h-4 text-[#9BCB3B]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Tool tracking access</li>
                </ul>
                {!authLoading && (
                  <div className="animate-in fade-in duration-700">
                    <Link href={user ? "/dashboard" : "/signup"} className="block w-full py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black hover:bg-slate-50 transition-all text-center uppercase text-xs tracking-[0.2em]">
                      {user ? "View Dashboard" : "Stay Free"}
                    </Link>
                  </div>
                )}
              </div>
              
              <div style={{ borderColor: '#9BCB3B' }} className="bg-white border-2 p-10 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] relative shadow-2xl shadow-[#9BCB3B]/10 text-center hover:scale-[1.02] transition-transform duration-500">
                <div style={{ backgroundColor: '#9BCB3B' }} className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 text-white text-[10px] font-black uppercase rounded-full tracking-widest">Most Popular</div>
                <h3 className="text-slate-400 font-bold uppercase text-xs mb-6 tracking-widest">Pro</h3>
                <div style={{ color: '#243F74' }} className="text-5xl md:text-6xl font-black mb-8 italic">₹199</div>
                <ul className="space-y-4 md:space-y-5 mb-10 md:mb-12 text-slate-500 text-sm font-bold">
                  <li className="flex items-center justify-center gap-2"><svg className="w-4 h-4 text-[#9BCB3B]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Unlimited clients</li>
                  <li className="flex items-center justify-center gap-2"><svg className="w-4 h-4 text-[#9BCB3B]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> PDF Export & Audit Notes</li>
                  <li className="flex items-center justify-center gap-2"><svg className="w-4 h-4 text-[#9BCB3B]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Smart Dashboard Alerts</li>
                </ul>
                <button 
                  onClick={goToPricing}
                  style={{ backgroundColor: '#243F74' }} 
                  className="w-full py-5 rounded-2xl font-black text-white shadow-xl shadow-[#243F74]/20 hover:scale-[1.02] active:scale-95 transition-all text-center uppercase text-xs tracking-[0.2em]"
                >
                  View Pro Plan
                </button>
              </div>
            </div>
          </div>
        </div>
        </Reveal>

        {/* SECTION: FINAL CTA - REPLACED WITH NEW COPY */}
        <Reveal>
        <section id="cta" style={{ backgroundColor: '#243F74' }} className="py-16 md:py-24 text-center text-white px-6 rounded-[3rem] md:rounded-[4rem] mt-12 md:mt-24 mb-12 md:mb-20 shadow-2xl shadow-[#243F74]/40 mx-4">
          <h2 className="text-3xl md:text-5xl font-black mb-8 md:mb-10 italic tracking-tight leading-snug">
            End every project with <br className="hidden md:block" /> clean access removal.
          </h2>
          {!authLoading && (
            <div className="animate-in fade-in zoom-in-95 duration-700">
              <Link href={user ? "/dashboard" : "/signup"}>
                <button 
                  style={{ backgroundColor: '#9BCB3B' }} 
                  className="w-full sm:w-auto text-white px-10 md:px-20 py-4 md:py-6 rounded-full text-lg md:text-2xl font-black hover:scale-105 transition-all shadow-2xl shadow-[#9BCB3B]/30 active:scale-95"
                >
                  {user ? "Go to Dashboard" : "Start tracking client access"}
                </button>
              </Link>
            </div>
          )}
        </section>
        </Reveal>
      </main>

      <footer className="bg-white border-t border-slate-100 pt-16 md:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid md:grid-cols-3 gap-12 md:gap-16 mb-16 md:mb-20 text-left">
            <div className="flex flex-col gap-6 md:gap-8">
              <Image 
                src="/logo.png" 
                alt="OffboardPro" 
                width={160} 
                height={40} 
                unoptimized
                className="object-contain" 
              />
              <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-xs uppercase tracking-tight">
                The professional offboarding checklist for modern freelancers and agencies.
              </p>
            </div>
            
            <div className="flex flex-col gap-6">
              <h4 style={{ color: '#243F74' }} className="font-black uppercase text-[11px] tracking-[0.3em]">Contact Us</h4>
              <a href="mailto:offboardpro@gmail.com" className="text-slate-500 font-black hover:text-[#9BCB3B] transition-colors text-xl italic underline decoration-2 underline-offset-8">
                offboardpro@gmail.com
              </a>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Typical reply: 24h</p>
            </div>

            <div className="flex flex-col gap-6">
              <h4 style={{ color: '#243F74' }} className="font-black uppercase text-[11px] tracking-[0.3em]">Product</h4>
              <Link href="/pricing" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-sm uppercase tracking-widest">Pricing</Link>
              <Link href="/signup" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-sm uppercase tracking-widest">Sign Up</Link>
              <Link href="/login" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-sm uppercase tracking-widest">Log In</Link>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 text-center">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] italic">
              &copy; 2026 OffboardPro — Clean Handovers, Zero Risk.
            </p>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              <Link href="/privacy" className="hover:text-[#243F74] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#243F74] transition-colors">Terms</Link>
              <Link href="/refund-policy" className="hover:text-[#243F74] transition-colors">Refunds</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}