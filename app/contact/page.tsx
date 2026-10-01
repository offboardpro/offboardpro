"use client";

import { useEffect, useState } from "react";
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
      <main className="w-full max-w-5xl mx-auto pt-8 sm:pt-12 md:pt-16 pb-20 sm:pb-28 px-4 sm:px-6">
        {/* HERO */}
        <div className="mb-10 sm:mb-14 md:mb-16 max-w-2xl">
          <span className="text-brand-green text-[10px] font-black uppercase tracking-widest italic block mb-4">
            Support
          </span>
          <h1 className="text-brand-navy text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 italic leading-tight">
            Stuck offboarding a client, or something else entirely?
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed">
            Whether it's a checklist question, a billing issue, or a bug —
            send it over. A real person reads every message.
          </p>
        </div>

        {/* QUICK ANSWERS — real, specific fixes so common problems don't
            need to wait on an email reply at all. */}
        <div className="mb-12 sm:mb-16">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
            Quick Answers
          </span>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-2xl p-5">
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

            <div className="border border-slate-100 rounded-2xl p-5">
              <p className="text-brand-navy text-sm font-black mb-1">
                Want to change or cancel your plan?
              </p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Go to Dashboard → Settings → Billing. You can upgrade,
                downgrade, or cancel yourself, instantly.
              </p>
            </div>

            <div className="border border-slate-100 rounded-2xl p-5">
              <p className="text-brand-navy text-sm font-black mb-1">
                A client says their portal link isn't working?
              </p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Open that client in your dashboard and click "Portal" again
                — it copies a fresh link you can resend right away.
              </p>
            </div>

            <div className="border border-slate-100 rounded-2xl p-5">
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

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16">
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
              <select
                id="contact-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 outline-none focus:border-brand-green focus:bg-white transition-all font-bold"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
