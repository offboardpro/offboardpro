"use client";

import Link from "next/link";
import Image from "next/image";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-700">
      {/* Simple Header */}
      <header className="px-6 py-6 border-b border-slate-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <Image src="/logo.png" alt="OffboardPro" width={120} height={40} className="object-contain" />
          </Link>
          <Link href="/" className="text-sm font-bold text-[#243F74]">Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl font-black text-[#243F74] mb-8 italic">Refund & Cancellation Policy</h1>
        
        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#9BCB3B] mb-4">1. Subscription Cancellation</h2>
            <p>
              You may cancel your OffboardPro Pro subscription at any time directly through your dashboard. 
              Upon cancellation, your Pro features will remain active until the end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#9BCB3B] mb-4">2. Refund Policy</h2>
            <p>
              Since OffboardPro offers a <strong>Free Starter Plan</strong> to test our services, we generally do not offer 
              refunds for the Pro subscription once the payment is successful.
            </p>
            <p className="mt-2">
              However, if you have been charged accidentally due to a technical error on our part, please contact us 
              within 48 hours of the transaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#9BCB3B] mb-4">3. Refund Processing</h2>
            <p>
              In cases where a refund is approved by our team, the amount will be credited back to your original 
              payment method (Bank Account/UPI/Card) within <strong>5-7 working days</strong>, as per standard 
              banking procedures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#9BCB3B] mb-4">4. Contact Us</h2>
            <p>
              For any issues related to payments or cancellations, please reach out to us at:
              <br />
              <span className="font-bold text-[#243F74]">offboardpro@gmail.com</span>
            </p>
          </section>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-50 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
        &copy; 2026 OffboardPro — Your Security Partner
      </footer>
    </div>
  );
}