"use client";

import Link from "next/link";
import Image from "next/image";

const NAVY = "#243F74";
const GREEN = "#9BCB3B";

const sections = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "Welcome to OffboardPro. These Terms of Service govern your access to and use of the OffboardPro website, application, and related services.",
      "By creating an account, accessing the application, or purchasing a subscription, you agree to these terms. If you do not agree, please do not use the service.",
    ],
  },
  {
    title: "2. Description of the Service",
    paragraphs: [
      "OffboardPro helps freelancers, consultants, and agencies organize client offboarding. Depending on your plan, features may include client and project management, tool tracking, offboarding checklists, task progress, activity history, and email reminders.",
      "The availability of particular features depends on your subscription plan and the functionality currently offered in the application. We may introduce, improve, modify, or discontinue features as the service evolves.",
    ],
  },
  {
    title: "3. Account Registration and Security",
    paragraphs: [
      "You are responsible for providing accurate account information, maintaining the security of your login credentials, and protecting access to your account.",
      "You are responsible for activities performed through your account. If you suspect unauthorized access, contact us promptly at hello@offboardpro.com.",
      "Do not share your account credentials with unauthorized individuals or use the service in a way that compromises another person's account or information.",
    ],
  },
  {
    title: "4. Your Responsibilities",
    paragraphs: [
      "You are responsible for ensuring that the information you enter into OffboardPro is accurate and kept up to date, including client details, project dates, tracked tools, deadlines, and offboarding tasks.",
      "You must have appropriate authorization to enter and manage information relating to your clients, projects, and third-party services.",
      "You are responsible for reviewing your offboarding checklists, completing tasks, verifying that access has actually been removed, and following any security requirements that apply to your work.",
    ],
  },
  {
    title: "5. Third-Party Tools and Access Removal",
    paragraphs: [
      "OffboardPro is a tracking, checklist, and reminder service. It does not automatically revoke, disable, or remove access to third-party accounts, platforms, websites, or client systems.",
      "You must manually remove or change access through the relevant third-party service and independently verify that the action has been completed.",
      "OffboardPro does not control third-party services and cannot guarantee their availability, security, permissions, or behavior. You are responsible for complying with the terms and security requirements of those services.",
    ],
  },
  {
    title: "6. Free and Paid Plans",
    paragraphs: [
      "OffboardPro may offer Free and paid subscription plans. The features, limits, and prices applicable to each plan are described on our pricing page or at checkout.",
      "We may change plan features or pricing prospectively. Where required by applicable law, we will provide notice of material changes before they take effect.",
      "Your access to particular features may change if you upgrade, downgrade, cancel, or allow a paid subscription to expire.",
    ],
  },
  {
    title: "7. Payments, Billing, and Cancellation",
    paragraphs: [
      "Paid subscriptions must be purchased through the payment options presented during checkout. Depending on your location and checkout option, payments may be processed by Razorpay or Dodo Payments.",
      "Your subscription may renew according to the billing frequency and terms displayed at checkout. You are responsible for reviewing the amount, billing period, and applicable terms before completing a purchase.",
      "You may request cancellation using the cancellation options available for your subscription or by contacting our support team. Cancellation is intended to stop future renewals; the timing and process depend on the applicable subscription and payment provider.",
      "Cancelling a subscription does not automatically entitle you to a refund. Subscription payments are generally non-refundable except where a refund or other remedy is required by applicable law or where a payment issue is reviewed and resolved under our policy.",
      "Please review our Refund & Cancellation Policy for further details.",
    ],
  },
  {
    title: "8. Acceptable Use",
    paragraphs: [
      "You agree not to use OffboardPro for unlawful activities, to violate another person's rights, to access information without authorization, or to interfere with the operation or security of the service.",
      "You must not attempt to disrupt the service, circumvent plan restrictions, exploit vulnerabilities, distribute malicious code, or access systems or data that you are not authorized to access.",
      "We may restrict or suspend access where we reasonably believe an account violates these terms, creates a security risk, or is being used unlawfully, subject to applicable law.",
    ],
  },
  {
    title: "9. Data and Privacy",
    paragraphs: [
      "Your use of OffboardPro is also governed by our Privacy Policy, which explains how information is collected, used, stored, and handled.",
      "You should avoid entering passwords, secret keys, authentication tokens, or other sensitive access credentials into OffboardPro. The service is intended to track offboarding activities, not to serve as a password manager.",
      "You are responsible for ensuring that you have the necessary rights and permissions to submit information about clients, projects, and other individuals.",
    ],
  },
  {
    title: "10. Service Availability and Changes",
    paragraphs: [
      "We aim to keep OffboardPro useful and available, but we do not guarantee uninterrupted or error-free operation. Maintenance, technical problems, third-party outages, or circumstances beyond our control may temporarily affect the service.",
      "We may update, improve, or modify the application over time. We will handle material changes, suspensions, or discontinuation in accordance with applicable law.",
    ],
  },
  {
    title: "11. Disclaimer of Warranties",
    paragraphs: [
      "To the extent permitted by applicable law, OffboardPro is provided on an \"as is\" and \"as available\" basis. We do not guarantee that the service will meet every requirement, prevent every offboarding mistake, or identify every access-related risk.",
      "OffboardPro provides organizational tools and reminders. You remain responsible for your own security procedures, project decisions, task completion, and verification of access removal.",
    ],
  },
  {
    title: "12. Limitation of Liability",
    paragraphs: [
      "To the extent permitted by applicable law, OffboardPro will not be liable for indirect, incidental, special, consequential, or punitive losses arising from your use of, or inability to use, the service.",
      "We are not responsible for access that remains active because a task was not completed, information was inaccurate, a reminder was missed, or a third-party service did not perform as expected.",
      "Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, or any rights or remedies that applicable law requires us to preserve.",
    ],
  },
  {
    title: "13. Suspension and Termination",
    paragraphs: [
      "You may stop using OffboardPro at any time. If you have a paid subscription, cancellation and billing will be handled according to the subscription terms and our Refund & Cancellation Policy.",
      "We may suspend or terminate access where reasonably necessary for security, suspected fraud, unlawful activity, material violations of these terms, or other legitimate operational reasons, subject to applicable law.",
      "If you stop using the service, you should export or save any information you need where the relevant functionality is available. Data retention and deletion are subject to our Privacy Policy and applicable law.",
    ],
  },
  {
    title: "14. Changes to These Terms",
    paragraphs: [
      "We may update these Terms of Service to reflect changes to OffboardPro, our practices, or applicable legal requirements.",
      "When we update these terms, we will revise the date shown on this page. Where required by law, we will provide additional notice or obtain any necessary consent.",
      "Your continued use of OffboardPro after updated terms take effect is subject to those terms to the extent permitted by applicable law.",
    ],
  },
];

export default function TermsOfService() {
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
              Legal Information
            </span>
          </div>

          <h1
            style={{ color: NAVY }}
            className="mb-5 text-4xl font-black italic leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            Terms of Service
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            These terms explain the rules for using OffboardPro, your
            responsibilities, and the conditions that apply to our service
            and subscriptions.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="h-[2px] w-8 rounded-full bg-[#9BCB3B]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Last Updated: October 11, 2026
            </p>
          </div>
        </div>

        {/* IMPORTANT NOTICE */}
        <div className="mb-12 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#243F74] text-lg text-white">
              !
            </div>

            <h2
              style={{ color: NAVY }}
              className="text-lg font-black sm:text-xl"
            >
              Important: You control access removal
            </h2>
          </div>

          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            OffboardPro helps you track client offboarding tasks and deadlines.
            It does not automatically remove access from third-party tools.
            You remain responsible for carrying out and verifying each access
            removal.
          </p>
        </div>

        {/* TERMS SECTIONS */}
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

                {section.title.startsWith("7.") && (
                  <Link
                    href="/refund-policy"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#243F74] underline decoration-[#9BCB3B] decoration-2 underline-offset-4 transition-colors hover:text-[#587F1C]"
                  >
                    Read our Refund & Cancellation Policy
                    <span aria-hidden="true">→</span>
                  </Link>
                )}

                {section.title.startsWith("9.") && (
                  <Link
                    href="/privacy"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#243F74] underline decoration-[#9BCB3B] decoration-2 underline-offset-4 transition-colors hover:text-[#587F1C]"
                  >
                    Read our Privacy Policy
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* CONTACT SUPPORT */}
        <section className="mt-16 rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:mt-20 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9BCB3B]">
                We're Here to Help
              </p>

              <h2
                style={{ color: NAVY }}
                className="mb-2 text-xl font-black sm:text-2xl"
              >
                Questions about these terms?
              </h2>

              <p className="text-sm leading-6 text-slate-500">
                Contact our team if you need clarification about using
                OffboardPro or your subscription.
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

      {/* FOOTER — MATCHING THE OTHER LEGAL PAGES */}
      <footer className="border-t border-slate-100 bg-white pb-8 pt-14 sm:pt-16 md:pt-20">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
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