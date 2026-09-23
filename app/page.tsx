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
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

// --- STAGGERED ITEM WRAPPER (for cards inside grids) ---
function RevealItem({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
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
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
      className={`h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-[0.97]"
      }`}
    >
      {children}
    </div>
  );
}

// --- SECTION KICKER / CAPTION ---
function Kicker({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      className={`text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-3 md:mb-4 text-center italic ${
        tone === "dark" ? "text-[#9BCB3B]" : "text-[#9BCB3B]"
      }`}
    >
      {children}
    </p>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

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
    { name: "How It Works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "Security", href: "#security" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
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

        <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-400">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-[#243F74] transition-colors"
            >
              {link.name}
            </Link>
          ))}

          {!authLoading &&
            (user ? (
              <div className="flex items-center gap-6 animate-in fade-in duration-500">
                <Link
                  href="/dashboard"
                  style={{ backgroundColor: "#9BCB3B" }}
                  className="text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-[#9BCB3B]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Go to Dashboard
                </Link>
                <div className="flex items-center gap-3 pl-6 border-l border-slate-100 group relative cursor-pointer">
                  <div className="text-right hidden sm:block text-slate-600">
                    <p
                      style={{ color: isPro ? "#9BCB3B" : "#243F74" }}
                      className="text-[10px] font-black uppercase tracking-widest leading-none mb-1"
                    >
                      {isPro ? "Pro Member" : "Free Plan"}
                    </p>
                    <p className="text-slate-400 text-xs font-bold leading-tight">
                      Hi, {user.displayName?.split(" ")[0] || "User"}
                    </p>
                  </div>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User"
                      className="w-9 h-9 rounded-full border-2 border-[#9BCB3B] object-cover"
                    />
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
              <div className="flex items-center gap-8 animate-in fade-in duration-500">
                <Link
                  href="/login"
                  className="hover:text-[#243F74] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  style={{ backgroundColor: "#243F74" }}
                  className="text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-[#243F74]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Get Started
                </Link>
              </div>
            ))}
        </nav>

        <button
          onClick={toggleMenu}
          className="lg:hidden flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 relative z-[110]"
        >
          <div
            className={`w-5 h-0.5 bg-[#243F74] transition-all duration-300 ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></div>
          <div
            className={`w-5 h-0.5 bg-[#243F74] transition-all duration-300 ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></div>
          <div
            className={`w-5 h-0.5 bg-[#243F74] transition-all duration-300 ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></div>
        </button>
      </div>

      <div
        className={`absolute top-[95%] left-6 right-6 lg:hidden transition-all duration-300 ease-out origin-top ${
          isMenuOpen
            ? "scale-y-100 opacity-100"
            : "scale-y-0 opacity-0 pointer-events-none"
        }`}
      >
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
          {!authLoading &&
            (user ? (
              <div className="flex flex-col gap-3">
                <Link
                  onClick={toggleMenu}
                  href="/dashboard"
                  className="w-full text-center py-4 rounded-xl bg-[#9BCB3B] text-white font-black shadow-lg shadow-[#9BCB3B]/20"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-500 font-black uppercase tracking-widest text-[10px] text-center"
                >
                  Logout Account
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  onClick={toggleMenu}
                  href="/signup"
                  className="w-full text-center py-4 rounded-xl bg-[#243F74] text-white font-black shadow-lg shadow-[#243F74]/20"
                >
                  Get Started
                </Link>
                <Link
                  onClick={toggleMenu}
                  href="/login"
                  className="w-full text-center py-4 rounded-xl border-2 border-slate-50 text-[#243F74] font-black"
                >
                  Login
                </Link>
              </div>
            ))}
        </div>
      </div>
    </header>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-4 md:py-6 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left group"
      >
        <span
          style={{ color: "#243F74" }}
          className="text-lg font-bold italic group-hover:text-[#9BCB3B] transition-colors"
        >
          {question}
        </span>
        <span
          className={`text-2xl transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
          style={{ color: "#9BCB3B" }}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100 mt-4"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
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
  const [isPro, setIsPro] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setShowScrollBtn(window.scrollY > 400);

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

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubscribe();
    };
  }, []);

  const goToPricing = () => router.push("/pricing");
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const marqueeItems = [
    "Freelancers",
    "Web Developers",
    "Designers",
    "Marketers",
    "Consultants",
    "Agencies",
  ];

  return (
    <div className="min-h-screen bg-white scroll-smooth relative font-sans selection:bg-[#9BCB3B] selection:text-white">
      <Header />

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 20s linear infinite;
        }
        @keyframes floatSlow {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(0, -22px);
          }
        }
        @keyframes floatSlowReverse {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(0, 18px);
          }
        }
        .animate-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }
        .animate-float-slow-reverse {
          animation: floatSlowReverse 8s ease-in-out infinite;
        }
      `}</style>

      <button
        onClick={scrollToTop}
        style={{
          backgroundColor: "#243F74",
          opacity: showScrollBtn ? 1 : 0,
          pointerEvents: showScrollBtn ? "auto" : "none",
          transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="fixed bottom-8 right-8 z-[150] p-4 rounded-full text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      <main className="overflow-x-clip">
        {/* ==================================================
            2. HERO SECTION
            ================================================== */}
        <section className="relative max-w-6xl mx-auto text-center pt-8 md:pt-20 pb-8 md:pb-12 px-6 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-1/2 -translate-x-[60%] w-72 h-72 md:w-[26rem] md:h-[26rem] rounded-full bg-[#9BCB3B]/10 blur-[90px] animate-float-slow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 left-1/2 translate-x-[20%] w-72 h-72 md:w-[24rem] md:h-[24rem] rounded-full bg-[#243F74]/10 blur-[90px] animate-float-slow-reverse"
          />

          <p
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(-10px)",
              transition: "all 1s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="relative text-[#9BCB3B] text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 italic"
          >
            CLIENT OFFBOARDING MANAGEMENT
          </p>

          <h1
            style={{
              color: "#243F74",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(-20px)",
              transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="text-4xl md:text-7xl font-black tracking-tight leading-tight md:leading-[1.05] mb-6 md:mb-8 italic"
          >
            Never forget to remove <br /> client access again.
          </h1>

          <p
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(-10px)",
              transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s",
            }}
            className="text-slate-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium mb-10 md:mb-12 px-2"
          >
            OffboardPro helps freelancers, consultants, and agencies keep track of client tools, access, deadlines, and offboarding tasks — all in one place.
          </p>

          <div className="mt-6 md:mt-8 mb-12 md:mb-16 flex flex-col items-center gap-4 min-h-[80px]">
            {!authLoading && (
              <div className="animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center gap-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                  {user ? (
                    <>
                      <Link href="/dashboard" className="w-full sm:w-auto">
                        <button
                          style={{ backgroundColor: "#243F74" }}
                          className="w-full sm:w-auto text-white px-10 md:px-14 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:scale-105 transition-all shadow-xl shadow-[#243F74]/20 active:scale-95"
                        >
                          Go to Dashboard
                        </button>
                      </Link>
                      <Link
                        href={isPro ? "#features" : "/pricing"}
                        className="w-full sm:w-auto"
                      >
                        <button className="w-full sm:w-auto border-2 border-slate-200 text-[#243F74] px-8 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:bg-slate-50 transition-all active:scale-95">
                          {isPro ? "View Pro Features" : "Explore Pro"}
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/signup" className="w-full sm:w-auto">
                        <button
                          style={{ backgroundColor: "#243F74" }}
                          className="w-full sm:w-auto text-white px-10 md:px-14 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:scale-105 transition-all shadow-xl shadow-[#243F74]/20 active:scale-95"
                        >
                          Start Offboarding
                        </button>
                      </Link>
                      <Link href="#how-it-works" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto border-2 border-slate-200 text-[#243F74] px-8 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:bg-slate-50 transition-all active:scale-95">
                          See How It Works
                        </button>
                      </Link>
                    </>
                  )}
                </div>

                <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest mt-2 italic">
                  No passwords stored. No complicated setup.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            3. AUDIENCE STRIP
            ================================================== */}
        <Reveal>
          <div className="pb-16 md:pb-24 overflow-hidden">
            <p className="text-center text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-8 md:mb-12 italic">
              BUILT FOR PEOPLE WHO MANAGE CLIENT PROJECTS
            </p>
            <div className="relative flex items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-12 md:gap-24">
                {[
                  ...marqueeItems,
                  ...marqueeItems,
                  ...marqueeItems,
                  ...marqueeItems,
                ].map((item, i) => (
                  <span
                    key={i}
                    className="text-[#243F74]/15 text-4xl md:text-7xl font-black italic tracking-tighter transition-colors duration-300 cursor-default hover:text-[#9BCB3B]/40 hover:scale-105 inline-block"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            4. PROBLEM
            ================================================== */}
        <Reveal>
          <div className="py-16 md:py-28 text-left px-6 max-w-5xl mx-auto">
            <div className="bg-slate-900 text-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#9BCB3B]/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#243F74]/40 blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

              <p className="relative text-[#9BCB3B]/70 text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 text-center md:text-left italic">
                THE PROBLEM
              </p>
              <h2 className="relative text-[#9BCB3B] text-3xl md:text-5xl font-black mb-4 italic text-center md:text-left leading-tight">
                The project ends. <br className="hidden md:block" />
                The access doesn't always.
              </h2>

              <p className="relative text-slate-300 text-base md:text-lg font-medium mb-10 leading-relaxed text-center md:text-left">
                When client work is finished, there can still be accounts, permissions, shared tools, and logins that need to be removed.
              </p>

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    t: "Forgotten access",
                    d: "You finish the project and move on — but some client access is still active.",
                  },
                  {
                    t: "Scattered information",
                    d: "Tools, accounts, deadlines, and handover tasks can live across messages, notes, and memory.",
                  },
                  {
                    t: "Missed follow-ups",
                    d: "Without a clear process, important access-removal tasks can easily be forgotten.",
                  },
                ].map((card, idx) => (
                  <RevealItem key={card.t} delay={idx * 100}>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 h-full hover:bg-white/10 hover:border-[#9BCB3B]/30 hover:-translate-y-1 transition-all duration-300">
                      <h3 className="text-white font-black text-lg mb-2 italic">
                        {card.t}
                      </h3>
                      <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                        {card.d}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </div>

              <div className="h-px bg-white/10 w-full mb-8" />

              <div className="bg-[#9BCB3B]/10 border border-[#9BCB3B]/20 p-6 md:p-8 rounded-2xl text-center md:text-left">
                <p className="text-[#9BCB3B] text-base md:text-xl font-black italic">
                  OffboardPro turns the last step of a project into a process you can actually follow.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            5. HOW OFFBOARDPRO SOLVES IT (FEATURES)
            ================================================== */}
        <Reveal>
          <section id="features" className="py-16 md:py-28 scroll-mt-24 px-6 max-w-6xl mx-auto text-left">
            <Kicker>PLATFORM FEATURES</Kicker>
            <h2
              style={{ color: "#243F74" }}
              className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-center italic"
            >
              Everything you need for a clean client offboarding.
            </h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 md:mb-16 text-sm md:text-base font-medium">
              From the first access record to the final project closure, OffboardPro keeps the process organized in one workspace.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  t: "Client & Project",
                  d: "Keep each client and project organized with the important dates and offboarding information in one place.",
                },
                {
                  t: "Tool Library",
                  d: "Select the tools used for the project from a structured library instead of building every checklist from scratch.",
                },
                {
                  t: "Offboarding Templates",
                  d: "Start with common workflows for web development, digital marketing, SEO, design, social media, or a general project.",
                },
                {
                  t: "Automated Checklist",
                  d: "Start an offboarding and OffboardPro creates the checklist based on the tools you've selected.",
                },
                {
                  t: "Instructions & Tasks",
                  d: "Work through each access-removal task with statuses, tool-specific instructions, assignments, and progress tracking.",
                },
                {
                  t: "Close & Review",
                  d: "When the work is finished, review the completion summary, record the closure, and keep the activity history.",
                },
              ].map((feat, idx) => (
                <RevealItem key={feat.t} delay={idx * 90}>
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-[#9BCB3B]/30 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#243F74]/5 text-[#243F74] flex items-center justify-center font-black mb-6 italic text-sm">
                        0{idx + 1}
                      </div>
                      <h3
                        style={{ color: "#243F74" }}
                        className="text-xl font-black mb-3 italic"
                      >
                        {feat.t}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {feat.d}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            6. HOW IT WORKS
            ================================================== */}
        <Reveal>
          <div
            id="how-it-works"
            className="py-16 md:py-28 border-t border-slate-50 scroll-mt-24 text-left px-6"
          >
            <div className="max-w-6xl mx-auto">
              <Kicker>THE PROCESS</Kicker>
              <h2
                style={{ color: "#243F74" }}
                className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-center italic"
              >
                From project ending to access removed.
              </h2>
              <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 md:mb-16 text-sm md:text-base font-medium">
                One clear workflow for managing the final access-removal steps of a client project.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
                {[
                  {
                    n: "01",
                    t: "Add the client & tools",
                    d: "Add the project, choose the tools, and set the important dates.",
                  },
                  {
                    n: "02",
                    t: "Start the offboarding",
                    d: "Start the workflow and generate the checklist for the selected tools.",
                  },
                  {
                    n: "03",
                    t: "Remove access",
                    d: "Work through the checklist, follow the instructions, and track each task.",
                  },
                  {
                    n: "04",
                    t: "Close the project",
                    d: "Review the completed work and close the offboarding when you're finished.",
                  },
                ].map((step, idx) => (
                  <RevealItem key={step.n} delay={idx * 100}>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-[#9BCB3B]/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                      <div>
                        <span
                          style={{ backgroundColor: "#9BCB3B" }}
                          className="text-white w-10 h-10 flex items-center justify-center rounded-2xl font-black mb-6 italic shadow-lg shadow-[#9BCB3B]/20 text-xs group-hover:scale-110 transition-transform duration-300"
                        >
                          {step.n}
                        </span>
                        <h3
                          style={{ color: "#243F74" }}
                          className="text-xl font-black mb-3 italic"
                        >
                          {step.t}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                          {step.d}
                        </p>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </div>

              {/* Workflow Flow Diagram Strip */}
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 text-center max-w-4xl mx-auto">
                <p className="text-[#243F74] font-black text-xs uppercase tracking-widest mb-6 italic">
                  Workflow Sequence
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs md:text-sm font-bold text-[#243F74]">
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#9BCB3B]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">ADD CLIENT</span>
                  <span className="text-[#9BCB3B]">↓</span>
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#9BCB3B]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">SELECT TOOLS</span>
                  <span className="text-[#9BCB3B]">↓</span>
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#9BCB3B]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">SET DATES</span>
                  <span className="text-[#9BCB3B]">↓</span>
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#9BCB3B]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">START OFFBOARDING</span>
                  <span className="text-[#9BCB3B]">↓</span>
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#9BCB3B]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">CHECKLIST GENERATED</span>
                  <span className="text-[#9BCB3B]">↓</span>
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#9BCB3B]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">REMOVE ACCESS</span>
                  <span className="text-[#9BCB3B]">↓</span>
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#9BCB3B]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">MARK TASKS COMPLETE</span>
                  <span className="text-[#9BCB3B]">↓</span>
                  <span className="bg-[#243F74] text-white px-3 py-1.5 rounded-xl hover:-translate-y-0.5 transition-transform duration-200 cursor-default">CLOSE PROJECT</span>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-6">
                  One clear process. No scattered checklists.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            7. WORKSPACE SHOWCASE
            ================================================== */}
        <Reveal>
          <section className="py-16 md:py-28 px-6 max-w-5xl mx-auto text-left">
            <div className="bg-slate-900 text-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-56 h-56 bg-[#9BCB3B]/10 blur-[100px] rounded-full"></div>
              <p className="relative text-slate-400 text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 text-center md:text-left italic">
                YOUR WORKSPACE
              </p>
              <h2 className="relative text-[#9BCB3B] text-3xl md:text-4xl font-black mb-4 italic text-center md:text-left">
                One workspace for the entire offboarding.
              </h2>
              <p className="relative text-slate-300 text-sm md:text-base font-medium mb-10 leading-relaxed text-center md:text-left max-w-2xl">
                See the project status, deadlines, tools, checklist progress, assignments, activity, and next actions without jumping between different places.
              </p>

              <div className="relative grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {[
                  "Project progress",
                  "Tool-by-tool checklist",
                  "Task status",
                  "Assignments",
                  "Activity history",
                  "Completion summary",
                ].map((callout, i) => (
                  <RevealItem key={callout} delay={i * 70}>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 h-full hover:bg-white/10 hover:border-[#9BCB3B]/30 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="w-2 h-2 rounded-full bg-[#9BCB3B] shrink-0"></div>
                      <span className="text-slate-200 text-xs md:text-sm font-bold italic">
                        {callout}
                      </span>
                    </div>
                  </RevealItem>
                ))}
              </div>

              <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-slate-300 text-sm font-medium italic">
                  Everything you need to see what is done, what remains, and what needs attention.
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            8. TOOL INSTRUCTIONS
            ================================================== */}
        <Reveal>
          <section className="py-16 md:py-24 px-6 max-w-5xl mx-auto text-left">
            <Kicker>TOOL GUIDES</Kicker>
            <h2
              style={{ color: "#243F74" }}
              className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-center italic"
            >
              Know what needs to be removed.
            </h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 text-sm md:text-base font-medium">
              Every selected tool can have its own access-removal instructions, so your checklist isn't just a list of names — it helps you understand what to do next.
            </p>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">
              {[
                {
                  name: "Google Ads",
                  items: [
                    "Remove user access",
                    "Verify remaining users",
                    "Confirm access removal",
                  ],
                },
                {
                  name: "GitHub",
                  items: [
                    "Remove collaborator access",
                    "Review repository permissions",
                    "Verify access is revoked",
                  ],
                },
              ].map((tool, idx) => (
                <RevealItem key={tool.name} delay={idx * 120}>
                  <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] h-full hover:border-[#9BCB3B]/30 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 style={{ color: "#243F74" }} className="font-black text-xl italic">
                        {tool.name}
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-[#243F74]/10 text-[#243F74] px-3 py-1 rounded-full">
                        Tool Guide
                      </span>
                    </div>
                    <ul className="space-y-3 text-slate-600 text-sm font-bold">
                      {tool.items.map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <span className="text-[#9BCB3B]">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </RevealItem>
              ))}
            </div>

            <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
              OffboardPro guides and tracks the process. It does not automatically revoke access from external services.
            </p>
          </section>
        </Reveal>

        {/* ==================================================
            9. TEAM ASSIGNMENTS
            ================================================== */}
        <Reveal>
          <section className="py-16 md:py-24 px-6 max-w-5xl mx-auto text-left">
            <div className="bg-[#243F74] text-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-[#9BCB3B]/10 blur-[100px] rounded-full"></div>
              <p className="relative text-slate-300 text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 text-center md:text-left italic">
                TEAM COLLABORATION
              </p>
              <h2 className="relative text-3xl md:text-4xl font-black mb-4 italic text-center md:text-left">
                Offboarding doesn't have to be a one-person job.
              </h2>
              <p className="relative text-slate-200 text-sm md:text-base font-medium mb-10 leading-relaxed text-center md:text-left max-w-2xl">
                Pro users can assign individual checklist tasks to team members and keep track of who is responsible for each task.
              </p>

              <div className="relative grid md:grid-cols-3 gap-4">
                {[
                  { task: "Remove GitHub access", who: "Alex" },
                  { task: "Remove Google Ads access", who: "Sarah" },
                  { task: "Review remaining access", who: "You" },
                ].map((row, idx) => (
                  <RevealItem key={row.task} delay={idx * 100}>
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/10 h-full hover:bg-white/20 hover:border-[#9BCB3B]/40 hover:-translate-y-1 transition-all duration-300">
                      <p className="font-bold text-sm text-white mb-2 italic">{row.task}</p>
                      <p className="text-xs text-[#9BCB3B] font-black uppercase tracking-widest">
                        Assigned to: {row.who}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            10. AUTOMATED REMINDERS
            ================================================== */}
        <Reveal>
          <section className="py-16 md:py-24 px-6 max-w-5xl mx-auto text-left">
            <Kicker>STAY ON TRACK</Kicker>
            <h2
              style={{ color: "#243F74" }}
              className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-center italic"
            >
              Don't rely on memory.
            </h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto mb-10 text-sm md:text-base font-medium">
              Pro users can receive automated email reminders around access-removal deadlines so important offboarding dates stay visible.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 text-center hover:border-[#9BCB3B]/20 transition-colors duration-300">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6 italic">
                Reminder Timeline
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs font-black text-[#243F74]">
                <span className="bg-white px-3 py-2 rounded-xl border border-slate-200 hover:-translate-y-0.5 hover:border-[#9BCB3B]/40 transition-all duration-200 cursor-default">30 days before</span>
                <span className="text-slate-300">→</span>
                <span className="bg-white px-3 py-2 rounded-xl border border-slate-200 hover:-translate-y-0.5 hover:border-[#9BCB3B]/40 transition-all duration-200 cursor-default">14 days before</span>
                <span className="text-slate-300">→</span>
                <span className="bg-white px-3 py-2 rounded-xl border border-slate-200 hover:-translate-y-0.5 hover:border-[#9BCB3B]/40 transition-all duration-200 cursor-default">7 days before</span>
                <span className="text-slate-300">→</span>
                <span className="bg-white px-3 py-2 rounded-xl border border-slate-200 hover:-translate-y-0.5 hover:border-[#9BCB3B]/40 transition-all duration-200 cursor-default">3 days before</span>
                <span className="text-slate-300">→</span>
                <span className="bg-[#9BCB3B] text-white px-3 py-2 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#9BCB3B]/30 transition-all duration-200 cursor-default">Deadline</span>
                <span className="text-slate-300">→</span>
                <span className="bg-red-50 text-red-600 px-3 py-2 rounded-xl border border-red-100 hover:-translate-y-0.5 transition-all duration-200 cursor-default">After deadline</span>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            11. SECURITY
            ================================================== */}
        <Reveal>
          <div
            id="security"
            className="py-16 md:py-28 bg-slate-50/50 rounded-[3rem] md:rounded-[4rem] scroll-mt-24 text-left px-6 mx-4"
          >
            <div className="max-w-5xl mx-auto">
              <Kicker>SECURITY &amp; TRUST</Kicker>
              <h2
                style={{ color: "#243F74" }}
                className="text-3xl md:text-4xl font-black tracking-tight mb-12 text-center italic"
              >
                Built for secure client handovers.
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                {[
                  {
                    t: "No passwords stored",
                    d: "OffboardPro tracks what access needs attention. It doesn't require you to store your client's passwords.",
                  },
                  {
                    t: "Access stays with original service",
                    d: "You remove access directly from the platform where the account or permission exists.",
                  },
                  {
                    t: "Clear offboarding history",
                    d: "Keep a record of task changes, assignments, activity, and project closure.",
                  },
                ].map((card, idx) => (
                  <RevealItem key={card.t} delay={idx * 100}>
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full">
                      <h3
                        style={{ color: "#243F74" }}
                        className="font-black mb-3 uppercase text-xs tracking-widest"
                      >
                        {card.t}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {card.d}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            12. WHO IT'S FOR
            ================================================== */}
        <Reveal>
          <div className="py-16 md:py-28 text-left px-6 max-w-5xl mx-auto scroll-mt-24">
            <Kicker>WHO IT'S FOR</Kicker>
            <h2
              style={{ color: "#243F74" }}
              className="text-3xl md:text-5xl font-black tracking-tight mb-12 md:mb-16 text-center italic"
            >
              Built for client-based businesses.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                { title: "Freelancers", desc: "Manage every client handover without relying on memory." },
                { title: "Web Developers", desc: "Track hosting, repositories, CMS, analytics, and other access." },
                { title: "Designers", desc: "Keep design tools and project access organized until closure." },
                { title: "Marketers & SEO Specialists", desc: "Track advertising, analytics, SEO, and social tools." },
                { title: "Consultants", desc: "Keep client access and project closure organized." },
                { title: "Agencies", desc: "Give your team a repeatable offboarding process." },
              ].map((role, i) => (
                <RevealItem key={role.title} delay={i * 70}>
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col justify-between h-full hover:border-[#9BCB3B]/30 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <h3 className="text-[#243F74] font-black text-lg mb-2 italic">
                      {role.title}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                      {role.desc}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </div>

            <div className="text-center bg-[#243F74] p-8 md:p-12 rounded-[2.5rem] shadow-xl">
              <p className="text-white text-lg md:text-xl font-bold mb-0 leading-relaxed italic">
                If you manage client access,{" "}
                <span className="text-[#9BCB3B]">
                  OffboardPro keeps your offboarding organized.
                </span>
              </p>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            13. FREE VS PRO (PRICING)
            ================================================== */}
        <Reveal>
          <div
            id="pricing"
            className="py-16 md:py-28 border-t border-slate-50 bg-slate-50/30 text-left px-6 scroll-mt-24 rounded-[3rem] md:rounded-[4rem]"
          >
            <div className="max-w-5xl mx-auto">
              <Kicker>PRICING</Kicker>
              <h2
                style={{ color: "#243F74" }}
                className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-center italic"
              >
                Start free. Upgrade when offboarding gets serious.
              </h2>
              <p className="text-slate-400 text-center text-xs md:text-sm font-bold uppercase tracking-widest mb-12 md:mb-16">
                Use the core workflow for free. Pro adds automation and team visibility.
              </p>

              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                {/* FREE CARD */}
                <RevealItem delay={0}>
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] text-center shadow-sm border border-slate-100 hover:scale-[1.01] transition-transform duration-500 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-slate-400 font-bold uppercase text-xs mb-4 tracking-widest">
                      FREE
                    </h3>
                    <div
                      style={{ color: "#243F74" }}
                      className="text-5xl md:text-6xl font-black mb-1 italic"
                    >
                      ₹0
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                      Forever
                    </p>
                    <ul className="space-y-3 md:space-y-4 mb-10 text-slate-500 text-xs md:text-sm font-bold text-left max-w-xs mx-auto">
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Client & project management
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Tool library
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Offboarding templates
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Project dates & deadlines
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Generated checklists
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Task status tracking
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Tool-specific instructions
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Workspace
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Activity timeline
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Completion summaries
                      </li>
                    </ul>
                  </div>
                  {!authLoading && (
                    <div className="animate-in fade-in duration-700">
                      <Link
                        href={user ? "/dashboard" : "/signup"}
                        className="block w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black hover:bg-slate-50 transition-all text-center uppercase text-xs tracking-[0.2em]"
                      >
                        Start Free
                      </Link>
                    </div>
                  )}
                </div>
                </RevealItem>

                {/* PRO CARD */}
                <RevealItem delay={120}>
                <div
                  style={{ borderColor: "#9BCB3B" }}
                  className="bg-white border-2 p-8 md:p-12 rounded-[2.5rem] relative shadow-2xl shadow-[#9BCB3B]/10 text-center hover:scale-[1.01] transition-transform duration-500 flex flex-col justify-between h-full"
                >
                  <div>
                    <h3 className="text-[#9BCB3B] font-bold uppercase text-xs mb-4 tracking-widest">
                      PRO
                    </h3>
                    <div
                      style={{ color: "#243F74" }}
                      className="text-5xl md:text-6xl font-black mb-1 italic"
                    >
                      ₹199
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                      /month
                    </p>
                    <ul className="space-y-3 md:space-y-4 mb-10 text-slate-500 text-xs md:text-sm font-bold text-left max-w-xs mx-auto">
                      <li className="flex items-center gap-3 text-[#243F74]">
                        <span className="text-[#9BCB3B]">✓</span> Everything in Free
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Unlimited clients
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Automated email reminders
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Needs Your Attention
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Task assignments
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#9BCB3B]">✓</span> Pro workflow features
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={goToPricing}
                    style={{ backgroundColor: "#243F74" }}
                    className="w-full py-4 rounded-2xl font-black text-white shadow-xl shadow-[#243F74]/20 hover:scale-[1.02] active:scale-95 transition-all text-center uppercase text-xs tracking-[0.2em]"
                  >
                    Get Pro
                  </button>
                </div>
                </RevealItem>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            14. WHAT HAPPENS AFTER SIGNUP?
            ================================================== */}
        <Reveal>
          <section className="py-16 md:py-24 px-6 max-w-5xl mx-auto text-left">
            <Kicker>GETTING STARTED</Kicker>
            <h2
              style={{ color: "#243F74" }}
              className="text-3xl md:text-4xl font-black tracking-tight mb-12 text-center italic"
            >
              What happens after you sign up?
            </h2>

            <div className="grid md:grid-cols-4 gap-6 mb-10">
              {[
                { step: "Step 1", t: "Create your account.", d: "Start with the free plan. No complicated setup." },
                { step: "Step 2", t: "Add your first client.", d: "Add the project, tools, and important dates." },
                { step: "Step 3", t: "Start your first offboarding.", d: "Generate your checklist and work through the access-removal tasks." },
                { step: "Step 4", t: "Close the project.", d: "Review the completed work and keep the offboarding organized." },
              ].map((s, idx) => (
                <RevealItem key={s.step} delay={idx * 90}>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full hover:border-[#9BCB3B]/30 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <span className="text-xs font-black uppercase text-[#9BCB3B] tracking-widest block mb-2">{s.step}</span>
                    <h3 className="font-black text-[#243F74] text-base mb-2 italic">{s.t}</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">{s.d}</p>
                  </div>
                </RevealItem>
              ))}
            </div>

            <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
              Your first offboarding can start from the dashboard.
            </p>
          </section>
        </Reveal>

        {/* ==================================================
            15. FAQ
            ================================================== */}
        <Reveal>
          <section id="faq" className="py-16 md:py-28 scroll-mt-24 text-left px-6">
            <div className="max-w-3xl mx-auto">
              <Kicker>GOT QUESTIONS?</Kicker>
              <h2
                style={{ color: "#243F74" }}
                className="text-3xl md:text-4xl font-black tracking-tight mb-10 md:mb-16 text-center italic"
              >
                Frequently Asked Questions
              </h2>
              <div className="space-y-1">
                <FAQItem
                  question="Do you store client passwords?"
                  answer="No. OffboardPro tracks access and offboarding tasks. It doesn't require you to store client passwords."
                />
                <FAQItem
                  question="What happens when I start an offboarding?"
                  answer="OffboardPro creates a checklist based on the tools selected for that client."
                />
                <FAQItem
                  question="Can I assign tasks?"
                  answer="Yes. Pro users can assign individual checklist tasks to team members."
                />
                <FAQItem
                  question="Do I get email reminders?"
                  answer="Pro users can receive automated email reminders around access-removal deadlines."
                />
                <FAQItem
                  question="Can I manage multiple clients?"
                  answer="Yes. Manage your clients, projects, deadlines, checklists, and offboarding progress from one dashboard."
                />
                <FAQItem
                  question="Do I have to remove access manually?"
                  answer="Yes. OffboardPro helps you organize and track the process. Access is removed directly through the service where the account or permission exists."
                />
              </div>
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            16. FINAL CTA
            ================================================== */}
        <Reveal>
          <section
            id="cta"
            style={{ backgroundColor: "#243F74" }}
            className="relative overflow-hidden py-16 md:py-24 text-center text-white px-6 rounded-[3rem] md:rounded-[4rem] mt-12 md:mt-20 mb-12 md:mb-20 shadow-2xl shadow-[#243F74]/40 mx-4"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#9BCB3B]/15 blur-[110px] rounded-full animate-float-slow"
            />
            <h2 className="relative text-3xl md:text-5xl font-black mb-4 italic tracking-tight leading-snug">
              Close every client project properly.
            </h2>
            <p className="relative text-slate-300 text-base md:text-xl font-medium mb-8 md:mb-10 max-w-xl mx-auto">
              Track the access. Complete the checklist. Remove what needs to go. Close the project.
            </p>
            {!authLoading && (
              <div className="relative animate-in fade-in zoom-in-95 duration-700">
                <Link href={user ? "/dashboard" : "/signup"}>
                  <button
                    style={{ backgroundColor: "#9BCB3B" }}
                    className="w-full sm:w-auto text-white px-10 md:px-20 py-4 md:py-6 rounded-full text-lg md:text-2xl font-black hover:scale-105 transition-all shadow-2xl shadow-[#9BCB3B]/30 active:scale-95"
                  >
                    {user ? "Go to Dashboard" : "Start Free"}
                  </button>
                </Link>
              </div>
            )}
          </section>
        </Reveal>
      </main>

      {/* ==================================================
          17. FOOTER
          ================================================== */}
      <footer className="bg-white border-t border-slate-100 pt-16 md:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid md:grid-cols-4 gap-10 md:gap-12 mb-16 md:mb-20 text-left">
            <div className="flex flex-col gap-6 md:col-span-1">
              <Image
                src="/logo.png"
                alt="OffboardPro"
                width={160}
                height={40}
                unoptimized
                className="object-contain"
              />
              <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-tight">
                OffboardPro helps freelancers, consultants, and agencies manage client access and close projects cleanly.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h4
                style={{ color: "#243F74" }}
                className="font-black uppercase text-[11px] tracking-[0.3em]"
              >
                Product
              </h4>
              <Link href="#how-it-works" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-xs uppercase tracking-widest">How It Works</Link>
              <Link href="#features" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-xs uppercase tracking-widest">Features</Link>
              <Link href="/pricing" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-xs uppercase tracking-widest">Pricing</Link>
              <Link href="#faq" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-xs uppercase tracking-widest">FAQ</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h4
                style={{ color: "#243F74" }}
                className="font-black uppercase text-[11px] tracking-[0.3em]"
              >
                Company
              </h4>
              <a href="mailto:offboardpro@gmail.com" className="text-slate-500 font-black hover:text-[#9BCB3B] transition-colors text-xs uppercase tracking-widest">
                Contact
              </a>
            </div>

            <div className="flex flex-col gap-4">
              <h4
                style={{ color: "#243F74" }}
                className="font-black uppercase text-[11px] tracking-[0.3em]"
              >
                Legal
              </h4>
              <Link href="/privacy" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-xs uppercase tracking-widest">Privacy</Link>
              <Link href="/terms" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-xs uppercase tracking-widest">Terms</Link>
              <Link href="/refund-policy" className="text-slate-500 font-black hover:text-[#243F74] transition-colors text-xs uppercase tracking-widest">Refund Policy</Link>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 text-center">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] italic">
              &copy; 2026 OffboardPro — Clean Handovers, Zero Risk.
            </p>
            <a
              href="mailto:offboardpro@gmail.com"
              className="text-slate-300 hover:text-[#243F74] transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
            >
              offboardpro@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}