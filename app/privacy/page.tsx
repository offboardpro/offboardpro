"use client";

import Link from "next/link";
import Image from "next/image";

const NAVY = "#243F74";
const GREEN = "#9BCB3B";

const sections = [
  {
    title: "1. Introduction",
    paragraphs: [
      "OffboardPro helps freelancers, consultants, and agencies organize client access, track offboarding tasks, and manage project closures. This Privacy Policy explains what information we collect, how we use it, and how we protect it when you use our service.",
      "By using OffboardPro, you acknowledge that your information will be handled as described in this policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    paragraphs: [
      "Account information: We may collect your name, email address, authentication details, and account preferences when you register and use OffboardPro.",
      "Client and project information: You may enter client names, project names, project dates, access-removal deadlines, review dates, selected tools, notes, and other information needed to manage offboarding.",
      "Checklist and activity information: We store checklist tasks, task statuses, assignments, progress, completion details, and activity records associated with your workspace.",
      "Subscription information: If you purchase a paid plan, information about your plan and subscription status may be processed to provide the service. Payments are handled through our payment provider.",
      "Technical information: Basic technical information may be processed to operate, maintain, troubleshoot, and secure the service.",
    ],
  },
  {
    title: "3. Passwords and Third-Party Account Access",
    paragraphs: [
      "OffboardPro is an access-tracking and offboarding management tool. It does not automatically remove access from external platforms, and it does not need your clients' passwords to track offboarding tasks.",
      "Do not enter passwords, authentication codes, API secrets, or other sensitive credentials into client names, project names, notes, or other text fields.",
      "You remain responsible for removing and verifying access directly within the relevant third-party services.",
    ],
  },
  {
    title: "4. How We Use Information",
    paragraphs: [
      "We use information to create and manage your account, maintain client and project workspaces, generate checklists, track task progress, manage assignments, send enabled email reminders, provide subscription features, respond to support requests, and maintain the reliability and security of OffboardPro.",
      "We do not sell your personal information or client lists.",
    ],
  },
  {
    title: "5. Email Communications",
    paragraphs: [
      "Depending on your account activity and subscription plan, OffboardPro may send account-related emails, welcome messages, service notifications, and scheduled offboarding reminders.",
      "Email delivery may depend on your settings, subscription status, the accuracy of your email address, and the availability of our email provider. We cannot guarantee delivery of every message.",
      "You can contact us if you have questions about emails sent by OffboardPro.",
    ],
  },
  {
    title: "6. Payments and Subscriptions",
    paragraphs: [
      "Paid subscriptions are processed through our payment provider, Razorpay. Payment information is handled according to the payment provider's processes and policies.",
      "OffboardPro may receive transaction references, subscription details, payment status, and related information necessary to verify payments and manage access to paid features.",
      "We do not intend to store complete payment card details on our own application servers.",
    ],
  },
  {
    title: "7. Service Providers and Information Sharing",
    paragraphs: [
      "We may use third-party service providers to operate OffboardPro, including services for authentication, database hosting, application hosting, email delivery, and payment processing. These providers process information as needed to perform their services.",
      "We do not sell your personal information. We may disclose information where reasonably necessary to operate the service, protect our rights and users, comply with applicable legal obligations, or respond to valid legal requests.",
      "We do not control the independent privacy practices of third-party services. Please review their policies when appropriate.",
    ],
  },
  {
    title: "8. Data Storage, Security, and Retention",
    paragraphs: [
      "We use reasonable technical and organizational measures intended to protect information from unauthorized access, loss, misuse, or alteration. However, no online service or method of electronic storage can be guaranteed to be completely secure.",
      "We retain information for as long as reasonably necessary to provide the service, maintain account records, meet legitimate operational needs, resolve disputes, and comply with applicable legal obligations.",
      "You are responsible for ensuring that the client information you enter into OffboardPro is appropriate for your use of the service.",
    ],
  },
  {
    title: "9. Your Choices and Account Deletion",
    paragraphs: [
      "You should ensure that the information you provide is accurate and avoid entering unnecessary sensitive information.",
      "If you would like to ask about accessing, correcting, or deleting your account information, contact us at hello@offboardpro.com. We may need to verify your request before acting on it.",
      "Some information may need to be retained where required by law or reasonably necessary for legitimate business, security, or dispute-resolution purposes.",
    ],
  },
  {
    title: "10. Cookies, Local Storage, and Sessions",
    paragraphs: [
      "OffboardPro and its underlying technologies may use cookies, browser storage, or similar mechanisms to support authentication, maintain sessions, remember preferences, and operate essential features.",
      "Disabling certain browser storage or cookies may affect your ability to sign in or use some features.",
    ],
  },
  {
    title: "11. Children's Privacy",
    paragraphs: [
      "OffboardPro is intended for professional use and is not designed for children. We do not knowingly seek to collect personal information from children who are not permitted to use the service under applicable law.",
    ],
  },
  {
    title: "12. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy as OffboardPro develops or our practices change. When we make changes, we will update the date shown at the top of this page. Your continued use of the service after an updated policy becomes effective is subject to the revised policy.",
    ],
  },
];

export default function PrivacyPolicy() {
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
              Legal & Privacy
            </span>
          </div>

          <h1
            style={{ color: NAVY }}
            className="mb-5 text-4xl font-black italic leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            Privacy Policy
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            How OffboardPro collects, uses, and protects information when you
            manage client access and project offboarding.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="h-[2px] w-8 rounded-full bg-[#9BCB3B]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Last Updated: October 11, 2026
            </p>
          </div>
        </div>

        {/* INTRODUCTION CARD */}
        <div className="mb-12 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#243F74] text-lg text-white">
              ✓
            </div>

            <h2
              style={{ color: NAVY }}
              className="text-lg font-black sm:text-xl"
            >
              Privacy matters
            </h2>
          </div>

          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            OffboardPro is designed to help you organize and track the
            offboarding process. Keep your workspace information appropriate
            for the task, never enter sensitive credentials into text fields,
            and always manage access directly through the relevant external
            service.
          </p>
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

        {/* CONTACT SUPPORT */}
        <section className="mt-16 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:mt-20 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9BCB3B]">
                Need Help?
              </p>

              <h2
                style={{ color: NAVY }}
                className="mb-2 text-xl font-black sm:text-2xl"
              >
                Questions about your data?
              </h2>

              <p className="text-sm leading-6 text-slate-500">
                Contact our team if you have questions about this Privacy
                Policy or your information.
              </p>
            </div>

            <a
              href="mailto:hello@offboardpro.com"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-[#243F74] px-6 py-4 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-[#243F74]/10 transition-all hover:-translate-y-0.5 hover:bg-[#1c315b]"
            >
              Email Support <span aria-hidden="true">→</span>
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