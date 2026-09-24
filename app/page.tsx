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
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-3 md:mb-4 text-center italic text-brand-green">
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
    <header className="sticky top-0 z-[100] w-full bg-white/90 backdrop-blur-md border-b border-slate-50 px-4 sm:px-6 md:px-10 py-4 md:py-6">
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <div className="w-[110px] md:w-[170px] flex items-center justify-start">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="OffboardPro"
              width={170}
              height={170}
              priority
              unoptimized
              className="object-contain"
            />
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-400">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-brand-navy transition-colors"
            >
              {link.name}
            </Link>
          ))}

          {!authLoading &&
            (user ? (
              <div className="flex items-center gap-6 animate-in fade-in duration-500">
                <Link
                  href="/dashboard"
                  className="bg-brand-green text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all"
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
                      className="w-9 h-9 rounded-full border-2 border-brand-green object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center font-black text-xs italic border-2 border-brand-green">
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
                  className="hover:text-brand-navy transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-brand-navy text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-brand-navy/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Start Free
                </Link>
              </div>
            ))}
        </nav>

        <button
          onClick={toggleMenu}
          className="lg:hidden flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 relative z-[110]"
        >
          <div
            className={`w-5 h-0.5 bg-brand-navy transition-all duration-300 ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></div>
          <div
            className={`w-5 h-0.5 bg-brand-navy transition-all duration-300 ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></div>
          <div
            className={`w-5 h-0.5 bg-brand-navy transition-all duration-300 ${
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
                className="text-brand-navy font-black text-lg italic p-3 hover:bg-slate-50 rounded-xl transition-colors"
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
                  className="w-full text-center py-4 rounded-xl bg-brand-green text-white font-black shadow-lg shadow-brand-green/20"
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
                  className="w-full text-center py-4 rounded-xl bg-brand-navy text-white font-black shadow-lg shadow-brand-navy/20"
                >
                  Start Free
                </Link>
                <Link
                  onClick={toggleMenu}
                  href="/login"
                  className="w-full text-center py-4 rounded-xl border-2 border-slate-50 text-brand-navy font-black"
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
        className="w-full flex items-center justify-between gap-4 text-left group"
      >
        <span
          className="text-brand-navy text-base sm:text-lg font-black leading-relaxed italic group-hover:text-brand-green transition-colors"
        >
          {question}
        </span>
        <span
          className={`text-2xl shrink-0 text-brand-green transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
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
    <div className="min-h-screen bg-white scroll-smooth relative font-sans selection:bg-brand-green selection:text-white">
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
            HERO SECTION
            ================================================== */}
        <section className="pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-10 sm:pb-12 md:pb-16 lg:pb-20 px-4 sm:px-6 relative text-center">
          <div className="w-full max-w-6xl mx-auto relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-[60%] w-72 h-72 md:w-[26rem] md:h-[26rem] rounded-full bg-brand-green/10 blur-[90px] animate-float-slow"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-10 left-1/2 translate-x-[20%] w-72 h-72 md:w-[24rem] md:h-[24rem] rounded-full bg-brand-navy/10 blur-[90px] animate-float-slow-reverse"
            />

            <p
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(-10px)",
                transition: "all 1s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className="relative text-brand-green text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 italic"
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
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-normal mb-6 md:mb-8 italic"
            >
              Never forget to remove <br className="hidden sm:block" /> client access again.
            </h1>

            <p
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(-10px)",
                transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s",
              }}
              className="text-base sm:text-lg md:text-xl leading-relaxed text-slate-500 max-w-3xl mx-auto font-medium mb-10 md:mb-12"
            >
              OffboardPro helps freelancers, consultants, and agencies keep track of client tools, access, deadlines, and offboarding tasks — all in one place.
            </p>

            <div className="mt-6 md:mt-8 mb-12 md:mb-16 flex flex-col items-center gap-4">
              {!authLoading && (
                <div className="animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center gap-4 w-full">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center">
                    {user ? (
                      <>
                        <Link href="/dashboard" className="w-full sm:w-auto">
                          <button
                            className="bg-brand-navy w-full sm:w-auto text-white px-10 md:px-14 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:scale-105 transition-all shadow-xl shadow-brand-navy/20 active:scale-95"
                          >
                            Go to Dashboard
                          </button>
                        </Link>
                        <Link
                          href={isPro ? "#features" : "#pricing"}
                          className="w-full sm:w-auto"
                        >
                          <button className="w-full sm:w-auto border-2 border-slate-200 text-brand-navy px-8 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:bg-slate-50 transition-all active:scale-95">
                            {isPro ? "View Pro Features" : "Explore Pro"}
                          </button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/signup" className="w-full sm:w-auto">
                          <button
                            className="bg-brand-navy w-full sm:w-auto text-white px-10 md:px-14 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:scale-105 transition-all shadow-xl shadow-brand-navy/20 active:scale-95"
                          >
                            Start Free
                          </button>
                        </Link>
                        <Link href="#how-it-works" className="w-full sm:w-auto">
                          <button className="w-full sm:w-auto border-2 border-slate-200 text-brand-navy px-8 py-4 md:py-5 rounded-full text-base md:text-lg font-bold hover:bg-slate-50 transition-all active:scale-95">
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
          </div>
        </section>

        {/* ==================================================
            AUDIENCE STRIP
            ================================================== */}
        <Reveal>
          <div className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6">
            <div className="w-full max-w-6xl mx-auto overflow-hidden">
              <p className="text-center text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-8 md:mb-12 italic">
                BUILT FOR PEOPLE WHO MANAGE CLIENT PROJECTS
              </p>
              <div className="relative flex items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-8 sm:gap-12 md:gap-24">
                  {[
                    ...marqueeItems,
                    ...marqueeItems,
                    ...marqueeItems,
                    ...marqueeItems,
                  ].map((item, i) => (
                    <span
                      key={i}
                      className="text-brand-navy/15 text-3xl sm:text-4xl md:text-7xl font-black italic tracking-tighter transition-colors duration-300 cursor-default hover:text-brand-green/40 hover:scale-105 inline-block"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            WHO IT'S FOR
            ================================================== */}
        <Reveal>
          <div className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <Kicker>WHO IT'S FOR</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-12 md:mb-16 text-center italic"
              >
                Built for client-based businesses.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 mb-12">
                {[
                  { title: "Freelancers", desc: "Manage every client handover without relying on memory." },
                  { title: "Web Developers", desc: "Track hosting, repositories, CMS, analytics, and other access." },
                  { title: "Designers", desc: "Keep design tools and project access organized until closure." },
                  { title: "Marketers & SEO Specialists", desc: "Track advertising, analytics, SEO, and social tools." },
                  { title: "Consultants", desc: "Keep client access and project closure organized." },
                  { title: "Agencies", desc: "Give your team a repeatable offboarding process." },
                ].map((role, i) => (
                  <RevealItem key={role.title} delay={i * 70}>
                    <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between h-full hover:border-brand-green/30 hover:bg-white hover:shadow-xl transition-all duration-300">
                      <h3 className="text-brand-navy font-black text-lg sm:text-xl mb-2 italic">
                        {role.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {role.desc}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </div>

              <div className="text-center bg-brand-navy p-8 md:p-12 rounded-[2.5rem] shadow-xl">
                <p className="text-white text-lg md:text-xl font-bold mb-0 leading-relaxed italic">
                  If you manage client access,{" "}
                  <span className="text-brand-green">
                    OffboardPro keeps your offboarding organized.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            PROBLEM
            ================================================== */}
        <Reveal>
          <div className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <div className="bg-slate-900 text-white p-5 sm:p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-navy/40 blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                <p className="relative text-brand-green/70 text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 text-center md:text-left italic">
                  THE PROBLEM
                </p>
                <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-black text-brand-green mb-4 italic text-center md:text-left leading-tight">
                  The project ends. <br className="hidden md:block" />
                  The access doesn't always.
                </h2>

                <p className="relative text-slate-300 text-sm sm:text-base leading-relaxed font-medium mb-10 text-center md:text-left max-w-3xl">
                  When client work is finished, there can still be accounts, permissions, shared tools, and logins that need to be removed.
                </p>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8 mb-12">
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
                      <div className="bg-white/5 p-5 sm:p-6 md:p-8 rounded-[2rem] border border-white/10 h-full hover:bg-white/10 hover:border-brand-green/30 hover:-translate-y-1 transition-all duration-300">
                        <h3 className="text-white font-black text-lg mb-2 italic">
                          {card.t}
                        </h3>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                          {card.d}
                        </p>
                      </div>
                    </RevealItem>
                  ))}
                </div>

                <div className="h-px bg-white/10 w-full mb-8" />

                <div className="bg-brand-green/10 border border-brand-green/20 p-5 sm:p-6 md:p-8 rounded-[2rem] text-center md:text-left">
                  <p className="text-brand-green text-base md:text-xl font-black italic">
                    OffboardPro turns the last step of a project into a process you can actually follow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            WORKFLOW SECTION / HOW IT WORKS
            ================================================== */}
        <Reveal>
          <div
            id="how-it-works"
            className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 border-t border-slate-50 scroll-mt-24 text-left"
          >
            <div className="w-full max-w-6xl mx-auto">
              <Kicker>THE PROCESS</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-4 text-center italic"
              >
                From project ending to access removed.
              </h2>
              <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 md:mb-16 text-sm sm:text-base leading-relaxed font-medium">
                One clear workflow for managing the final access-removal steps of a client project.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-16">
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
                    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[2rem] border border-slate-100 hover:border-brand-green/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                      <div>
                        <span
                          className="bg-brand-green text-white w-10 h-10 flex items-center justify-center rounded-2xl font-black mb-6 italic shadow-lg shadow-brand-green/20 text-xs group-hover:scale-110 transition-transform duration-300"
                        >
                          {step.n}
                        </span>
                        <h3
                          className="text-brand-navy text-lg sm:text-xl font-black mb-3 italic"
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

              {/* Workflow Sequence Strip */}
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 text-center max-w-4xl mx-auto">
                <p className="text-brand-navy font-black text-xs uppercase tracking-widest mb-6 italic">
                  Workflow Sequence
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs md:text-sm font-bold text-brand-navy">
                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-green/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    ADD CLIENT
                  </span>

                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline">→</span>

                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-green/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    SELECT TOOLS
                  </span>

                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline">→</span>

                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-green/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    SET DATES
                  </span>

                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline">→</span>

                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-green/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    START OFFBOARDING
                  </span>

                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline">→</span>

                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-green/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    CHECKLIST GENERATED
                  </span>

                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline">→</span>

                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-green/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    REMOVE ACCESS
                  </span>

                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline">→</span>

                  <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-green/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                    MARK TASKS COMPLETE
                  </span>

                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline">→</span>

                  <span className="bg-brand-navy text-white px-3 py-1.5 rounded-xl hover:-translate-y-0.5 transition-transform duration-200 cursor-default">
                    CLOSE PROJECT
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-6">
                  One clear process. No scattered checklists.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==================================================
            FEATURES SECTION
            ================================================== */}
        <Reveal>
          <section id="features" className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 scroll-mt-24 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <Kicker>PLATFORM FEATURES</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-4 text-center italic"
              >
                Everything you need for a clean client offboarding.
              </h2>
              <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 md:mb-16 text-sm sm:text-base leading-relaxed font-medium">
                From the first access record to the final project closure, OffboardPro keeps the process organized in one workspace.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
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
                    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[2rem] border border-slate-100 hover:border-brand-green/30 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center font-black mb-6 italic text-sm">
                          0{idx + 1}
                        </div>
                        <h3
                          className="text-brand-navy text-lg sm:text-xl font-black mb-3 italic"
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
            </div>
          </section>
        </Reveal>

        {/* =========================================================
            SCROLL EXPERIENCE — WATCH THE OFFBOARDING HAPPEN
        ========================================================= */}
        <OffboardingScrollExperience />

        {/* ==================================================
            WORKSPACE SECTION
            ================================================== */}
        <Reveal>
          <section className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <div className="bg-slate-900 text-white p-5 sm:p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-56 h-56 bg-brand-green/10 blur-[100px] rounded-full"></div>
                <p className="relative text-slate-400 text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 text-center md:text-left italic">
                  YOUR WORKSPACE
                </p>
                <h2 className="relative text-brand-green text-3xl sm:text-4xl md:text-5xl font-black mb-4 italic text-center md:text-left">
                  One workspace for the entire offboarding.
                </h2>
                <p className="relative text-slate-300 text-sm sm:text-base leading-relaxed font-medium mb-10 text-center md:text-left max-w-2xl">
                  See the project status, deadlines, tools, checklist progress, assignments, activity, and next actions without jumping between different places.
                </p>

                <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 mb-10">
                  {[
                    "Project progress",
                    "Tool-by-tool checklist",
                    "Task status",
                    "Assignments",
                    "Activity history",
                    "Completion summary",
                  ].map((callout, i) => (
                    <RevealItem key={callout} delay={i * 70}>
                      <div className="bg-white/5 border border-white/10 p-5 sm:p-6 md:p-8 rounded-[2rem] flex items-center gap-3 h-full hover:bg-white/10 hover:border-brand-green/30 transition-all duration-300">
                        <div className="w-2 h-2 rounded-full bg-brand-green shrink-0"></div>
                        <span className="text-slate-200 text-sm sm:text-base font-bold italic">
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
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            TOOL INSTRUCTIONS SECTION
            ================================================== */}
        <Reveal>
          <section className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <Kicker>TOOL GUIDES</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-4 text-center italic"
              >
                Know what needs to be removed.
              </h2>
              <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 md:mb-16 text-sm sm:text-base leading-relaxed font-medium">
                Every selected tool can have its own access-removal instructions, so your checklist isn't just a list of names — it helps you understand what to do next.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 mb-10">
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
                    <div className="bg-slate-50 border border-slate-100 p-6 sm:p-8 rounded-[2rem] h-full hover:border-brand-green/30 hover:bg-white hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-brand-navy font-black text-xl italic">
                          {tool.name}
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-brand-navy/10 text-brand-navy px-3 py-1 rounded-full">
                          Tool Guide
                        </span>
                      </div>
                      <ul className="space-y-3 text-slate-600 text-sm font-bold">
                        {tool.items.map((item) => (
                          <li key={item} className="flex items-center gap-3">
                            <span className="text-brand-green">✓</span> {item}
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
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            TEAM ASSIGNMENTS
            ================================================== */}
        <Reveal>
          <section className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <div className="bg-brand-navy text-white p-5 sm:p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-brand-green/10 blur-[100px] rounded-full"></div>
                <p className="relative text-slate-300 text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 text-center md:text-left italic">
                  TEAM COLLABORATION
                </p>
                <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-black mb-4 italic text-center md:text-left">
                  Offboarding doesn't have to be a one-person job.
                </h2>
                <p className="relative text-slate-200 text-sm sm:text-base leading-relaxed font-medium mb-10 text-center md:text-left max-w-2xl">
                  Pro users can assign individual checklist tasks to team members and keep track of who is responsible for each task.
                </p>

                <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
                  {[
                    { task: "Remove GitHub access", who: "Alex" },
                    { task: "Remove Google Ads access", who: "Sarah" },
                    { task: "Review remaining access", who: "You" },
                  ].map((row, idx) => (
                    <RevealItem key={row.task} delay={idx * 100}>
                      <div className="bg-white/10 p-5 sm:p-6 md:p-8 rounded-[2rem] border border-white/10 h-full hover:bg-white/20 hover:border-brand-green/40 transition-all duration-300">
                        <p className="font-bold text-sm sm:text-base text-white mb-2 italic">{row.task}</p>
                        <p className="text-xs text-brand-green font-black uppercase tracking-widest">
                          Assigned to: {row.who}
                        </p>
                      </div>
                    </RevealItem>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            REMINDER TIMELINE
            ================================================== */}
        <Reveal>
          <section className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <Kicker>STAY ON TRACK</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-4 text-center italic"
              >
                Don't rely on memory.
              </h2>
              <p className="text-slate-500 text-center max-w-2xl mx-auto mb-12 md:mb-16 text-sm sm:text-base leading-relaxed font-medium">
                Pro users can receive automated email reminders around access-removal deadlines so important offboarding dates stay visible.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 text-center">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-6 italic">
                  Reminder Timeline
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6">
                  <div className="w-full sm:w-auto text-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-brand-navy">
                    30 days before
                  </div>
                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline font-black">→</span>

                  <div className="w-full sm:w-auto text-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-brand-navy">
                    14 days before
                  </div>
                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline font-black">→</span>

                  <div className="w-full sm:w-auto text-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-brand-navy">
                    7 days before
                  </div>
                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline font-black">→</span>

                  <div className="w-full sm:w-auto text-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-brand-navy">
                    3 days before
                  </div>
                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline font-black">→</span>

                  <div className="w-full sm:w-auto text-center bg-brand-green text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black">
                    Deadline
                  </div>
                  <span className="text-brand-green text-base sm:hidden">↓</span>
                  <span className="text-brand-green hidden sm:inline font-black">→</span>

                  <div className="w-full sm:w-auto text-center bg-red-50 text-red-600 px-4 py-2.5 rounded-xl border border-red-100 text-xs sm:text-sm font-bold">
                    After deadline
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            SECURITY SECTION
            ================================================== */}
        <Reveal>
          <div
            id="security"
            className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 border-t border-slate-50 scroll-mt-24 text-left"
          >
            <div className="w-full max-w-6xl mx-auto">
              <Kicker>SECURITY & TRUST</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-12 md:mb-16 text-center italic"
              >
                Built for secure client handovers.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
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
                    <div className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 h-full">
                      <h3
                        className="text-brand-navy font-black mb-3 uppercase text-xs tracking-widest"
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
            1. PRICING SECTION
            ================================================== */}
        <Reveal>
          <div
            id="pricing"
            className="py-12 sm:py-14 md:py-20 lg:py-24 border-t border-slate-100 bg-slate-50/30 px-4 sm:px-6 scroll-mt-24"
          >
            <div className="w-full max-w-6xl mx-auto">

              {/* Heading */}
              <div className="text-center mb-12 md:mb-16">
                <h2
                  className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-4 italic leading-tight"
                >
                  Simple pricing. Built around your workflow.
                </h2>

                <p className="text-slate-400 text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                  Start with the core offboarding workflow for free. Upgrade when you
                  need more clients, automation, and team coordination.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">

                {/* FREE */}
                <div className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col shadow-sm hover:shadow-xl transition-all duration-500">

                  <div className="mb-6">
                    <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] mb-3">
                      Free
                    </p>

                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-brand-navy text-5xl sm:text-6xl font-black italic"
                      >
                        ₹0
                      </span>

                      <span className="text-slate-400 font-bold text-sm">
                        / forever
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm font-medium mt-3">
                      Everything you need to start managing client offboarding.
                    </p>
                  </div>

                  <div className="h-px bg-slate-100 mb-6" />

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                    Core workflow
                  </p>

                  <ul className="space-y-3 sm:space-y-4 mb-8">

                    {[
                      "Up to 3 active clients",
                      "Client & project management",
                      "Tool library & templates",
                      "Generated offboarding checklists",
                      "Task & progress tracking",
                      "Client workspace & activity timeline",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 font-semibold"
                      >
                        <span className="text-brand-green font-black shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}

                  </ul>

                  {!authLoading && (
                    <div className="mt-auto">
                      <Link
                        href={user ? "/dashboard" : "/signup"}
                        className="block w-full py-4 sm:py-5 rounded-2xl border-2 border-slate-200 text-brand-navy font-black hover:bg-slate-50 transition-all text-center uppercase text-xs tracking-[0.15em]"
                      >
                        {user ? "View Dashboard" : "Start Free"}
                      </Link>
                    </div>
                  )}
                </div>


                {/* PRO */}
                <div className="bg-white border-2 border-brand-green rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col shadow-xl shadow-brand-green/10 relative overflow-hidden">

                  <div className="absolute top-0 right-0 px-5 sm:px-6 py-2 bg-brand-green text-white text-[10px] font-black uppercase rounded-bl-2xl tracking-widest">
                    Pro
                  </div>

                  <div className="mb-6">
                    <p className="text-brand-navy font-black uppercase text-xs tracking-[0.2em] mb-3">
                      Pro
                    </p>

                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-brand-navy text-5xl sm:text-6xl font-black italic"
                      >
                        ₹199
                      </span>

                      <span className="text-slate-400 font-bold text-sm">
                        / month
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm font-medium mt-3">
                      For freelancers and agencies managing more clients and
                      offboarding work.
                    </p>
                  </div>

                  <div className="h-px bg-slate-100 mb-6" />

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy mb-4">
                    Everything in Free, plus
                  </p>

                  <ul className="space-y-3 sm:space-y-4 mb-8">

                    {[
                      "Unlimited clients",
                      "Automated email reminders",
                      "Deadline reminders",
                      "Needs Your Attention",
                      "Task assignments",
                      "Team member responsibility",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 font-bold"
                      >
                        <span className="text-brand-green font-black shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}

                  </ul>

                  {!authLoading && (
                    <div className="mt-auto">
                      <Link
                        href={user ? "/pricing" : "/signup"}
                        className="block w-full py-4 sm:py-5 rounded-2xl bg-brand-navy text-white font-black hover:bg-[#1d335e] transition-all text-center uppercase text-xs tracking-[0.15em] shadow-lg"
                      >
                        {user ? "Upgrade to Pro" : "Get Pro"}
                      </Link>
                    </div>
                  )}

                </div>
              </div>

              {/* Small reassurance */}
              <p className="text-center text-xs text-slate-400 font-semibold mt-8">
                Upgrade when you need more clients, automation, and team coordination.
              </p>

            </div>
          </div>
        </Reveal>

        {/* ==================================================
            AFTER SIGNUP
            ================================================== */}
        <Reveal>
          <section className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 text-left">
            <div className="w-full max-w-6xl mx-auto">
              <Kicker>GETTING STARTED</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-12 md:mb-16 text-center italic"
              >
                What happens after you sign up?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10">
                {[
                  { step: "Step 1", t: "Create your account.", d: "Start with the free plan. No complicated setup." },
                  { step: "Step 2", t: "Add your first client.", d: "Add the project, tools, and important dates." },
                  { step: "Step 3", t: "Start your first offboarding.", d: "Generate your checklist and work through the access-removal tasks." },
                  { step: "Step 4", t: "Close the project.", d: "Review the completed work and keep the offboarding organized." },
                ].map((s, idx) => (
                  <RevealItem key={s.step} delay={idx * 90}>
                    <div className="bg-slate-50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 h-full hover:border-brand-green/30 hover:bg-white hover:shadow-lg transition-all duration-300">
                      <span className="text-xs font-black uppercase text-brand-green tracking-widest block mb-2">{s.step}</span>
                      <h3 className="font-black text-brand-navy text-base sm:text-lg mb-2 italic">{s.t}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
                    </div>
                  </RevealItem>
                ))}
              </div>

              <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                Your first offboarding can start from the dashboard.
              </p>
            </div>
          </section>
        </Reveal>

        {/* ==================================================
            FAQ SECTION
            ================================================== */}
        <Reveal>
          <section id="faq" className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6 scroll-mt-24 text-left">
            <div className="w-full max-w-3xl mx-auto">
              <Kicker>GOT QUESTIONS?</Kicker>
              <h2
                className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-normal mb-12 md:mb-16 text-center italic"
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
            FINAL CTA
            ================================================== */}
        <Reveal>
          <section className="py-12 sm:py-14 md:py-20 lg:py-24 px-4 sm:px-6">
            <div
              id="cta"
              className="bg-brand-navy w-full max-w-6xl mx-auto relative overflow-hidden py-14 sm:py-16 md:py-20 text-center text-white px-6 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl shadow-brand-navy/40"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-green/15 blur-[110px] rounded-full animate-float-slow"
              />
              <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-black mb-4 italic tracking-normal leading-snug">
                Close every client project properly.
              </h2>
              <p className="relative text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed font-medium mb-8 md:mb-10 max-w-xl mx-auto">
                Track the access. Complete the checklist. Remove what needs to go. Close the project.
              </p>
              {!authLoading && (
                <div className="relative animate-in fade-in zoom-in-95 duration-700">
                  <Link href={user ? "/dashboard" : "/signup"}>
                    <button
                      className="bg-brand-green w-full sm:w-auto text-white px-10 md:px-20 py-4 md:py-6 rounded-full text-lg md:text-2xl font-black hover:scale-105 transition-all shadow-2xl shadow-brand-green/30 active:scale-95"
                    >
                      {user ? "Go to Dashboard" : "Start Free"}
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        </Reveal>
      </main>

      {/* ==================================================
          16. NEW FOOTER
          ================================================== */}
      <footer className="bg-white border-t border-slate-100 pt-14 sm:pt-16 md:pt-20 pb-8">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">

          {/* Main Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 lg:gap-16 pb-12 md:pb-16">

            {/* BRAND */}
            <div className="sm:col-span-2 lg:col-span-1">

              <Link href="/" className="inline-block mb-5">
                <Image
                  src="/logo.png"
                  alt="OffboardPro"
                  width={150}
                  height={40}
                  unoptimized
                  className="object-contain"
                />
              </Link>

              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Client offboarding for freelancers, consultants, and agencies.
              </p>

            </div>


            {/* PRODUCT */}
            <div>
              <h4 className="text-sm font-black text-brand-navy mb-5">
                Product
              </h4>

              <div className="flex flex-col gap-3">

                <Link
                  href="/#how-it-works"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                >
                  How It Works
                </Link>

                <Link
                  href="/#features"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                >
                  Features
                </Link>

                <Link
                  href="/#pricing"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                >
                  Pricing
                </Link>

                <Link
                  href="/#faq"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                >
                  FAQ
                </Link>

              </div>
            </div>


            {/* ACCOUNT */}
            <div>
              <h4 className="text-sm font-black text-brand-navy mb-5">
                Account
              </h4>

              <div className="flex flex-col gap-3">

                <Link
                  href="/signup"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                >
                  Sign Up
                </Link>

                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                >
                  Log In
                </Link>

                <Link
                  href="/dashboard"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                >
                  Dashboard
                </Link>

              </div>
            </div>


            {/* CONTACT */}
            <div>
              <h4 className="text-sm font-black text-brand-navy mb-5">
                Contact
              </h4>

              <div className="flex flex-col gap-3">

                <a
                  href="mailto:offboardpro@gmail.com"
                  className="text-sm font-semibold text-slate-500 hover:text-brand-green transition-colors break-words"
                >
                  offboardpro@gmail.com
                </a>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Have a question or need help? Get in touch with us.
                </p>

              </div>
            </div>

          </div>


          {/* Bottom Footer */}
          <div className="pt-7 sm:pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-5">

            <p className="text-xs text-slate-400 text-center md:text-left">
              © 2026 OffboardPro. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">

              <Link
                href="/privacy"
                className="text-xs font-semibold text-slate-400 hover:text-brand-navy transition-colors"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-xs font-semibold text-slate-400 hover:text-brand-navy transition-colors"
              >
                Terms
              </Link>

              <Link
                href="/refund-policy"
                className="text-xs font-semibold text-slate-400 hover:text-brand-navy transition-colors"
              >
                Refund Policy
              </Link>

            </div>

          </div>

        </div>
      </footer>
    </div>
  );
}

function OffboardingScrollExperience() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("offboarding-story");

      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const total = Math.max(rect.height - viewportHeight, 1);

      const current = Math.min(
        Math.max(-rect.top, 0),
        total
      );

      setScrollProgress(current / total);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* =========================================================
     STAGES
  ========================================================= */

  const stage =
    scrollProgress < 0.16
      ? 0
      : scrollProgress < 0.34
      ? 1
      : scrollProgress < 0.58
      ? 2
      : scrollProgress < 0.80
      ? 3
      : 4;

  const progressPercentage =
    stage === 0
      ? 0
      : stage === 1
      ? 25
      : stage === 2
      ? 50
      : stage === 3
      ? 75
      : 100;

  /* =========================================================
     TOOLS
  ========================================================= */

  const tools = [
    {
      name: "GitHub",
      short: "GH",
      description: "Repository access",
    },
    {
      name: "Vercel",
      short: "VE",
      description: "Deployment access",
    },
    {
      name: "Figma",
      short: "FI",
      description: "Design workspace",
    },
    {
      name: "Google Analytics",
      short: "GA",
      description: "Analytics access",
    },
  ];

  const completedCount =
    stage === 0
      ? 0
      : stage === 1
      ? 1
      : stage === 2
      ? 2
      : stage === 3
      ? 3
      : 4;

  const status =
    stage === 0
      ? "ACTIVE"
      : stage === 1
      ? "OFFBOARDING"
      : stage === 2
      ? "IN PROGRESS"
      : stage === 3
      ? "READY TO CLOSE"
      : "CLOSED";

  return (
    <section
      id="offboarding-story"
      className="relative w-full overflow-hidden bg-[#f8fafc] border-y border-slate-100"
    >
      {/* =====================================================
          LONG SCROLL AREA
      ====================================================== */}

      <div className="relative min-h-[115vh] sm:min-h-[145vh] lg:min-h-[175vh]">

        {/* ===================================================
            STICKY SCREEN
        ==================================================== */}

        <div className="sticky top-0 min-h-screen w-full flex items-center overflow-hidden">

          {/* =================================================
              BACKGROUND
          ================================================== */}

          <div className="absolute inset-0 pointer-events-none overflow-hidden">

            <div
              className="absolute rounded-full blur-3xl bg-brand-green/10
                         w-56 h-56 sm:w-80 sm:h-80 lg:w-[500px] lg:h-[500px]"
              style={{
                left: `${-10 + scrollProgress * 10}%`,
                top: "18%",
              }}
            />

            <div
              className="absolute rounded-full blur-3xl bg-brand-navy/5
                         w-56 h-56 sm:w-72 sm:h-72 lg:w-[450px] lg:h-[450px]"
              style={{
                right: `${-10 + scrollProgress * 8}%`,
                bottom: "5%",
              }}
            />

          </div>

          {/* =================================================
              MAIN CONTENT
          ================================================== */}

          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12">

            {/* =================================================
                HEADING
            ================================================== */}

            <div className="text-center mb-7 sm:mb-10 md:mb-12">

              <p className="text-brand-green text-[9px] sm:text-[10px] md:text-xs font-black tracking-[0.22em] sm:tracking-[0.25em] mb-3 sm:mb-4">
                THE OFFBOARDPRO WORKFLOW
              </p>

              <h2
                className="text-brand-navy text-[2rem] leading-[1.05] sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-normal italic"
              >
                Watch the offboarding happen.
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm md:text-base lg:text-lg max-w-xl lg:max-w-2xl mx-auto mt-3 sm:mt-4 leading-relaxed px-2">
                From project ending to access removed, every step stays visible.
              </p>

            </div>

            {/* =================================================
                PRODUCT AREA
            ================================================== */}

            <div className="relative w-full max-w-5xl mx-auto">

              {/* =================================================
                  DESKTOP FLOATING CARD — LEFT
              ================================================== */}

              <div
                className="absolute left-0 xl:-left-16 top-24 hidden lg:block"
                style={{
                  transform: `
                    translateY(${scrollProgress * -90}px)
                    rotate(${scrollProgress * -7 - 3}deg)
                  `,
                  transition:
                    "transform 700ms cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <div className="w-40 xl:w-44 bg-white border border-slate-100 rounded-2xl shadow-xl px-4 py-4">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-brand-navy">
                        GH
                      </span>
                    </div>

                    <div className="min-w-0">

                      <p className="text-xs font-black text-brand-navy">
                        GitHub
                      </p>

                      <p
                        className={`text-[9px] font-bold mt-1 ${
                          completedCount >= 1
                            ? "text-[#6d941f]"
                            : "text-slate-400"
                        }`}
                      >
                        {completedCount >= 1
                          ? "Access removed"
                          : "Waiting..."}
                      </p>

                    </div>

                  </div>

                </div>
              </div>

              {/* =================================================
                  DESKTOP FLOATING CARD — RIGHT
              ================================================== */}

              <div
                className="absolute right-0 xl:-right-16 top-40 hidden lg:block"
                style={{
                  transform: `
                    translateY(${scrollProgress * 120}px)
                    rotate(${scrollProgress * 7 + 3}deg)
                  `,
                  transition:
                    "transform 700ms cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <div className="w-40 xl:w-44 bg-white border border-slate-100 rounded-2xl shadow-xl px-4 py-4">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-brand-navy">
                        FI
                      </span>
                    </div>

                    <div className="min-w-0">

                      <p className="text-xs font-black text-brand-navy">
                        Figma
                      </p>

                      <p
                        className={`text-[9px] font-bold mt-1 ${
                          completedCount >= 3
                            ? "text-[#6d941f]"
                            : "text-slate-400"
                        }`}
                      >
                        {completedCount >= 3
                          ? "Access removed"
                          : "Waiting..."}
                      </p>

                    </div>

                  </div>

                </div>
              </div>

              {/* =================================================
                  CENTRAL PRODUCT WINDOW
              ================================================== */}

              <div
                className="relative w-full"
                style={{
                  perspective: "1400px",
                }}
              >

                <div
                  className="relative w-full bg-white
                             rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem]
                             border border-slate-200
                             shadow-[0_25px_80px_rgba(36,63,116,0.10)]
                             sm:shadow-[0_30px_100px_rgba(36,63,116,0.12)]
                             overflow-hidden"
                  style={{
                    transform: `
                      perspective(1400px)
                      rotateX(${scrollProgress * 2.5}deg)
                      rotateY(${(scrollProgress - 0.5) * 2.5}deg)
                      scale(${1 + scrollProgress * 0.01})
                    `,
                    transition:
                      "transform 700ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                >

                  {/* =================================================
                      BROWSER BAR
                  ================================================== */}

                  <div className="h-11 sm:h-12 md:h-14 px-4 sm:px-6 md:px-8 border-b border-slate-100 flex items-center justify-between">

                    <div className="flex items-center gap-1.5">

                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-300" />
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-300" />
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-green" />

                    </div>

                    <div className="hidden sm:block text-[8px] md:text-[9px] font-black text-slate-300 tracking-[0.2em]">
                      OFFBOARDPRO WORKSPACE
                    </div>

                    <div className="w-6 sm:w-10" />

                  </div>

                  {/* =================================================
                      WORKSPACE
                  ================================================== */}

                  <div className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">

                    {/* ===============================================
                        CLIENT HEADER
                    ================================================ */}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 mb-6 sm:mb-8">

                      <div className="min-w-0">

                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 tracking-[0.18em] sm:tracking-[0.2em] mb-1.5 sm:mb-2">
                          CLIENT WORKSPACE
                        </p>

                        <h3
                          className="text-brand-navy text-xl sm:text-2xl md:text-3xl font-black tracking-normal truncate"
                        >
                          Acme Digital
                        </h3>

                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">
                          Website Redesign
                        </p>

                      </div>

                      <div
                        className={`self-start sm:self-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-black tracking-widest shrink-0 ${
                          stage === 4
                            ? "bg-brand-navy text-white"
                            : "bg-brand-green/10 text-[#6d941f]"
                        }`}
                      >
                        {status}
                      </div>

                    </div>

                    {/* ===============================================
                        PROGRESS HEADER
                    ================================================ */}

                    <div className="mb-6 sm:mb-8 md:mb-10">

                      <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3">

                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 truncate">
                          {stage === 0 && "Project ending soon"}
                          {stage === 1 && "Offboarding has started"}
                          {stage === 2 && "Removing client access"}
                          {stage === 3 && "Everything is almost complete"}
                          {stage === 4 && "Client access removed"}
                        </span>

                        <span
                          className="text-brand-navy text-xs sm:text-sm font-black shrink-0"
                        >
                          {progressPercentage}%
                        </span>

                      </div>

                      <div className="h-2 sm:h-2.5 md:h-3 bg-slate-100 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-brand-green rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.max(
                              progressPercentage,
                              stage === 0 ? 3 : 0
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* ===============================================
                        CHECKLIST
                    ================================================ */}

                    <div className="space-y-2 sm:space-y-3">

                      {tools.map((tool, index) => {

                        const completed =
                          index < completedCount;

                        const active =
                          index === completedCount &&
                          stage > 0 &&
                          stage < 4;

                        return (
                          <div
                            key={tool.name}
                            className={`flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border transition-all duration-700 ${
                              completed
                                ? "bg-brand-green/5 border-brand-green/20"
                                : active
                                ? "bg-blue-50/50 border-blue-100"
                                : "bg-slate-50 border-slate-100"
                            }`}
                          >

                            {/* TOOL */}

                            <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 min-w-0">

                              <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                                  completed
                                    ? "bg-brand-green text-white"
                                    : active
                                    ? "bg-brand-navy text-white"
                                    : "bg-white text-slate-300 border border-slate-200"
                                }`}
                              >
                                {completed ? (
                                  <svg
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="3"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <span className="text-[9px] sm:text-[10px] font-black">
                                    {index + 1}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">

                                <p className="text-xs sm:text-sm font-black text-slate-700 truncate">
                                  {tool.name}
                                </p>

                                <p className="hidden sm:block text-[10px] md:text-xs text-slate-400 font-medium mt-0.5 truncate">
                                  {tool.description}
                                </p>

                              </div>

                            </div>

                            {/* STATUS */}

                            <span
                              className={`text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-[0.08em] sm:tracking-widest shrink-0 ${
                                completed
                                  ? "text-[#6d941f]"
                                  : active
                                  ? "text-brand-navy"
                                  : "text-slate-300"
                              }`}
                            >
                              {completed
                                ? "REMOVED"
                                : active
                                ? "REMOVING"
                                : "PENDING"}
                            </span>

                          </div>
                        );
                      })}

                    </div>

                    {/* ===============================================
                        FINAL STATE
                    ================================================ */}

                    <div
                      className={`mt-6 sm:mt-8 md:mt-10 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-7 text-center transition-all duration-700 ${
                        stage === 4
                          ? "bg-brand-navy"
                          : "bg-slate-50"
                      }`}
                    >

                      <div
                        className={`mx-auto w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-all duration-700 ${
                          stage === 4
                            ? "bg-brand-green text-white scale-100"
                            : "bg-white text-slate-200 scale-90"
                        }`}
                      >

                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>

                      </div>

                      <p
                        className={`text-base sm:text-lg md:text-xl font-black ${
                          stage === 4
                            ? "text-white"
                            : "text-slate-300"
                        }`}
                      >
                        {stage === 4
                          ? "Offboarding complete."
                          : "Complete the checklist."}
                      </p>

                      <p
                        className={`text-[10px] sm:text-xs mt-1 ${
                          stage === 4
                            ? "text-white/60"
                            : "text-slate-300"
                        }`}
                      >
                        {stage === 4
                          ? "No client access left behind."
                          : "Every access point stays visible."}
                      </p>

                    </div>

                  </div>
                </div>

              </div>

              {/* =================================================
                  MOBILE STATUS CARD
              ================================================== */}

              <div className="flex sm:hidden justify-center mt-5">

                <div className="bg-white border border-slate-100 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 max-w-full">

                  <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse shrink-0" />

                  <span className="text-[8px] font-black text-brand-navy tracking-[0.12em] truncate">
                    {stage === 0 && "PROJECT ENDING"}
                    {stage === 1 && "OFFBOARDING STARTED"}
                    {stage === 2 && "ACCESS BEING REMOVED"}
                    {stage === 3 && "READY TO CLOSE"}
                    {stage === 4 && "OFFBOARDING COMPLETE"}
                  </span>

                </div>

              </div>

            </div>

            {/* =================================================
                DESKTOP STAGE INDICATOR
            ================================================== */}

            <div className="hidden sm:flex justify-center mt-8 md:mt-10">

              <div className="flex items-center gap-2 sm:gap-3">

                {[0, 1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      stage >= item
                        ? "w-7 sm:w-10 bg-brand-green"
                        : "w-3 sm:w-5 bg-slate-200"
                    }`}
                  />
                ))}

              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}