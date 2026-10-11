"use client";

import Link from "next/link";
import Image from "next/image";

const NAVY = "#243F74";
const GREEN = "#9BCB3B";

const sections = [
  {
    title: "1. Subscription Cancellation",
    paragraphs: [
      "You may request cancellation of your OffboardPro Pro subscription using the cancellation options available for your subscription or by contacting our support team.",
      "Cancellation is intended to stop future renewals. Your access to paid features may continue until the end of your current paid billing period, depending on your subscription terms and the applicable payment provider.",
      "Cancelling a subscription does not, by itself, entitle you to a refund for a payment already made.",
    ],
  },
  {
    title: "2. No-Refund Policy",
    paragraphs: [
      "Except where a refund or other remedy is required by applicable law, subscription payments for OffboardPro are non-refundable once successfully processed.",
      "This policy applies to monthly and annual subscriptions, unused subscription time, partially used billing periods, and situations where you change your mind after purchasing a subscription.",
      "Please review the available features and pricing before purchasing a paid plan. Where available, you can use the Free plan to evaluate OffboardPro before upgrading.",
    ],
  },
  {
    title: "3. Duplicate Charges and Payment Errors",
    paragraphs: [
      "If you believe you have been charged more than once for the same subscription or that a payment was processed incorrectly, contact us at hello@offboardpro.com.",
      "Please provide the transaction reference, approximate transaction date, and the email address associated with your OffboardPro account. Do not send passwords, full card numbers, CVVs, or other sensitive payment credentials.",
      "We will review the information and work with the relevant payment provider where necessary. Any correction, reversal, or refund will be handled in accordance with applicable law and the circumstances of the transaction.",
    ],
  },
  {
    title: "4. Payment Providers",
    paragraphs: [
      "OffboardPro uses Razorpay for applicable payments in India and Dodo Payments for applicable international payments. The payment provider used for your transaction may depend on your location and the checkout option presented to you.",
      "Your payment may be subject to the relevant provider's terms, processing procedures, and applicable banking rules. Payment processing times for any permitted refund or reversal may vary.",
      "For payment-specific questions, you may contact our support team. We may ask for your transaction reference so we can identify the relevant payment.",
    ],
  },
  {
    title: "5. Access After Cancellation",
    paragraphs: [
      "When your subscription ends, access to Pro features may be removed or changed according to your subscription terms. You may need to move to the Free plan or take other steps presented in your account.",
      "You remain responsible for reviewing your workspace and any information you need before your paid subscription ends.",
    ],
  },
  {
    title: "6. Changes to This Policy",
    paragraphs: [
      "We may update this Refund & Cancellation Policy as our service, subscription options, or legal obligations change. Updates will be published on this page with a revised last-updated date.",
    ],
  },
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-700 selection:bg-[#9BCB3B]/20">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            aria-label="OffboardPro home"
            className="transition-transform hover:scale-[1.02]"
          >
            <Image
              src="/logo.png"
              alt="OffboardPro"
              width={150}
              height={40}
              priority
              unoptimized
              className="h-auto object-contain"
            />
          </Link>

          <Link
            href="/"
            className="rounded-full border border-slate-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-[#243F74] transition-all hover:border-[#9BCB3B] hover:bg-[#9BCB3B]/10 sm:px-5"
          >
            Back to Home
          </Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-4xl px-6 py-14 sm:px-8 sm:py-16 md:py-24">
        {/* PAGE HEADING */}
        <div className="mb-14 md:mb-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#9BCB3B]/30 bg-[#9BCB3B]/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-[#9BCB3B]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#243F74]">
              Billing & Subscriptions
            </span>
          </div>

          <h1
            style={{ color: NAVY }}
            className="mb-5 text-4xl font-black italic leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            Refund & Cancellation Policy
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Please review this policy before purchasing an OffboardPro
            subscription. It explains our approach to cancellations, refunds,
            and payment-related issues.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="h-[2px] w-8 rounded-full bg-[#9BCB3B]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Last Updated: October 11, 2026
            </p>
          </div>
        </div>

        {/* REFUND SUMMARY */}
        <div className="mb-12 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#243F74] text-lg text-white">
              ₹
            </div>

            <h2
              style={{ color: NAVY }}
              className="text-lg font-black sm:text-xl"
            >
              Understand our refund policy
            </h2>
          </div>

          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            OffboardPro subscription payments are generally non-refundable,
            except where a refund or other remedy is required by applicable
            law. If you believe a duplicate charge or payment-processing error
            occurred, please contact our support team for review.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#243F74]">
              Razorpay
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#243F74]">
              Dodo Payments
            </span>
          </div>
        </div>

        {/* POLICY SECTIONS */}
        <div className="space-y-12 sm:space-y-14">
          {sections.map((section) => (
            <section key={section.title} className="group">
              <div className="mb-5 flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-200 transition-colors group-hover:bg-[#9BCB3B]" />

                <h2
                  style={{ color: NAVY }}
                  className="text-xs font-black uppercase leading-6 tracking-[0.16em] sm:text-sm sm:tracking-[0.2em]"
                >
                  {section.title}
                </h2>
              </div>

              <div className="space-y-4 pl-5 sm:pl-6">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-7 text-slate-600 sm:text-base sm:leading-8"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* SUPPORT CARD */}
        <section className="mt-16 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:mt-20 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9BCB3B]">
                Billing Support
              </p>

              <h2
                style={{ color: NAVY }}
                className="mb-2 text-xl font-black sm:text-2xl"
              >
                Have a payment question?
              </h2>

              <p className="text-sm leading-6 text-slate-500">
                Contact us if you need help with a payment, subscription, or
                suspected duplicate charge.
              </p>
            </div>

            <a
              href="mailto:hello@offboardpro.com"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-[#243F74] px-6 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-[#243F74]/10 transition-all hover:-translate-y-0.5 hover:bg-[#1c315b]"
            >
              Contact Support <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER — MATCHES LANDING PAGE */}
      <footer className="border-t border-slate-100 bg-white pb-8 pt-14 sm:pt-16 md:pt-20">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
          {/* MAIN FOOTER */}
          <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 sm:gap-12 md:pb-16 lg:grid-cols-4 lg:gap-16">
            {/* BRAND */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="mb-5 inline-block">
                <Image
                  src="/logo.png"
                  alt="OffboardPro"
                  width={150}
                  height={40}
                  unoptimized
                  className="object-contain"
                />
              </Link>

              <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                Client offboarding for freelancers, consultants, and agencies.
              </p>
            </div>

            {/* PRODUCT */}
            <div>
              <h4 className="mb-5 text-sm font-black text-[#243F74]">
                Product
              </h4>

              <div className="flex flex-col gap-3">
                <Link
                  href="/#how-it-works"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#243F74]"
                >
                  How It Works
                </Link>

                <Link
                  href="/#features"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#243F74]"
                >
                  Features
                </Link>

                <Link
                  href="/pricing"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#243F74]"
                >
                  Pricing
                </Link>

                <Link
                  href="/#faq"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#243F74]"
                >
                  FAQ
                </Link>
              </div>
            </div>

            {/* ACCOUNT */}
            <div>
              <h4 className="mb-5 text-sm font-black text-[#243F74]">
                Account
              </h4>

              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#243F74]"
                >
                  Sign Up
                </Link>

                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#243F74]"
                >
                  Log In
                </Link>

                <Link
                  href="/dashboard"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#243F74]"
                >
                  Dashboard
                </Link>
              </div>
            </div>

            {/* CONTACT */}
            <div>
              <h4 className="mb-5 text-sm font-black text-[#243F74]">
                Contact
              </h4>

              <div className="flex flex-col gap-3">
                <a
                  href="mailto:hello@offboardpro.com"
                  className="break-words text-sm font-semibold text-slate-500 transition-colors hover:text-[#9BCB3B]"
                >
                  hello@offboardpro.com
                </a>

                <p className="text-xs leading-relaxed text-slate-400">
                  Have a question or need help? Get in touch with us.
                </p>

                <Link
                  href="/contact"
                  className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#9BCB3B]"
                >
                  Contact Us →
                </Link>
              </div>
            </div>
          </div>

          {/* BOTTOM FOOTER */}
          <div className="flex flex-col items-center justify-between gap-5 border-t border-slate-100 pt-7 sm:pt-8 md:flex-row">
            <p className="text-center text-xs text-slate-400 md:text-left">
              © 2026 OffboardPro. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              <Link
                href="/privacy"
                className="text-xs font-semibold text-slate-400 transition-colors hover:text-[#243F74]"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-xs font-semibold text-slate-400 transition-colors hover:text-[#243F74]"
              >
                Terms
              </Link>

              <Link
                href="/refund-policy"
                className="text-xs font-semibold text-slate-400 transition-colors hover:text-[#243F74]"
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