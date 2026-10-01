"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const CONTACT_EMAIL = "hello@offboardpro.com";

const TOPICS = [
  "General question",
  "Billing & subscriptions",
  "Bug report",
  "Feature request",
  "Something else",
];

// Custom-styled replacement for the native <select>, which on mobile opens
// the browser/OS's own unstyled picker sheet instead of matching the rest
// of the app — same fix already applied to the dashboard's dropdowns.
function TopicDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id="contact-topic"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 outline-none focus:border-brand-green focus:bg-white transition-all font-bold text-left"
      >
        <span>{value}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden animate-scale-in">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between ${
                t === value
                  ? "bg-slate-50 text-brand-navy"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{t}</span>
              {t === value && <span className="text-brand-green">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContactPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus({ type: "error", text: "Please fill in every field before sending." });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({
          type: "error",
          text: data?.error || "Something went wrong. Please try again.",
        });
        return;
      }

      setStatus({
        type: "success",
        text: "Sent. We read every message and usually reply within one business day.",
      });
      setName("");
      setEmail("");
      setTopic(TOPICS[0]);
      setMessage("");
    } catch (error) {
      console.error("Contact form submit error:", error);
      setStatus({
        type: "error",
        text: "Something went wrong sending that. Please try again, or email us directly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative font-sans selection:bg-brand-green/20">
      {/* =========================
          NAVIGATION
      ========================== */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-5 sm:py-7 md:py-8 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center transition-transform hover:scale-105"
        >
          <Image
            src="/logo.png"
            alt="OffboardPro"
            width={140}
            height={45}
            sizes="140px"
            quality={90}
            className="object-contain w-[120px] sm:w-[140px] h-auto"
            priority
          />
        </Link>

        {!authLoading && (
          <Link
            href={user ? "/dashboard" : "/login"}
            className="text-slate-400 font-bold text-sm hover:text-brand-navy transition-colors"
          >
            {user ? "Dashboard" : "Log In"}
          </Link>
        )}
      </nav>

      {/* =========================
          MAIN
      ========================== */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        {/* HERO — centered, with the same glow-blob + kicker + bold italic
            heading rhythm used on the landing page, so this page doesn't
            feel like a different site. */}
        <div className="relative pt-2 sm:pt-4 pb-10 sm:pb-14 md:pb-16 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 left-1/2 -translate-x-[70%] w-56 h-56 md:w-72 md:h-72 rounded-full bg-brand-green/10 blur-[80px] animate-float-slow"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-4 left-1/2 translate-x-[10%] w-56 h-56 md:w-72 md:h-72 rounded-full bg-brand-navy/10 blur-[80px] animate-float-slow-reverse"
          />

          <span className="relative block text-brand-green text-xs md:text-sm font-black uppercase tracking-[0.25em] mb-4 italic">
            Support
          </span>

          <h1 className="relative text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 italic leading-tight max-w-2xl mx-auto">
            Stuck offboarding a client, or something else entirely?
          </h1>

          <p className="relative text-slate-500 text-base sm:text-lg font-medium leading-relaxed max-w-xl mx-auto">
            Whether it's a checklist question, a billing issue, or a bug —
            send it over. A real person reads every message.
          </p>
        </div>

        {/* QUICK ANSWERS — real, specific fixes so common problems don't
            need to wait on an email reply at all. */}
        <div className="mb-12 sm:mb-16">
          <span className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
            Quick Answers
          </span>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-2xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-navy/5 border border-brand-navy/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <p className="text-brand-navy text-sm font-black mb-1">
                  Forgot your password?
                </p>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Head to the{" "}
                  <Link href="/login" className="text-brand-green font-bold hover:underline">
                    login page
                  </Link>{" "}
                  and click "Forgot password" — no need to wait for us.
                </p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-brand-navy text-sm font-black mb-1">
                  Want to change or cancel your plan?
                </p>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Go to Dashboard → Settings → Billing. You can upgrade,
                  downgrade, or cancel yourself, instantly.
                </p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-navy/5 border border-brand-navy/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <p className="text-brand-navy text-sm font-black mb-1">
                  A client says their portal link isn't working?
                </p>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Open that client in your dashboard and click "Portal" again
                  — it copies a fresh link you can resend right away.
                </p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-brand-navy text-sm font-black mb-1">
                  Not getting email reminders?
                </p>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Check spam for mail from reminders@offboardpro.com, and
                  confirm Email Alerts is switched on for that client.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16">
          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 outline-none focus:border-brand-green focus:bg-white transition-all font-bold placeholder:text-slate-300"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 outline-none focus:border-brand-green focus:bg-white transition-all font-bold placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-topic"
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1"
              >
                Topic
              </label>
              <TopicDropdown value={topic} onChange={setTopic} />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 ml-1"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  topic === "Bug report"
                    ? "What happened, and what did you expect instead?"
                    : "What's going on?"
                }
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-brand-green focus:bg-white transition-all font-bold placeholder:text-slate-300 resize-none"
              />
            </div>

            {status && (
              <div
                role={status.type === "error" ? "alert" : "status"}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  status.type === "error"
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-brand-green/20 bg-brand-green/10 text-[#5f8318]"
                }`}
              >
                {status.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-brand-navy px-10 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>

          {/* DIRECT CONTACT */}
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-7 sm:p-8 h-fit">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
              Prefer email?
            </span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-brand-navy text-lg sm:text-xl font-black italic hover:text-brand-green transition-colors break-all"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed">
              Same inbox, same team — usually a reply within one business
              day. If you're already a customer, include the email your
              account uses so we can find your workspace faster.
            </p>
          </div>
        </div>
      </main>

      {/* =========================
          FOOTER (matches pricing/landing footer)
      ========================== */}
      <footer className="bg-white border-t border-slate-100 pt-14 sm:pt-16 md:pt-20 pb-8">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 lg:gap-16 pb-12 md:pb-16">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block mb-5">
                <Image
                  src="/logo.png"
                  alt="OffboardPro"
                  width={150}
                  height={48}
                  sizes="150px"
                  quality={90}
                  className="object-contain"
                />
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Client offboarding for freelancers, consultants, and agencies.
              </p>
            </div>

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
                  href="/pricing"
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

            <div>
              <h4 className="text-sm font-black text-brand-navy mb-5">
                Account
              </h4>
              <div className="flex flex-col gap-3">
                {!authLoading && user ? (
                  <Link
                    href="/dashboard"
                    className="text-sm font-semibold text-slate-500 hover:text-brand-navy transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-brand-navy mb-5">
                Contact
              </h4>
              <div className="flex flex-col gap-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-sm font-semibold text-slate-500 hover:text-brand-green transition-colors break-words"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Have a question or need help? Get in touch with us.
                </p>
              </div>
            </div>
          </div>

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
