import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // 1. Added Razorpay Script support
import { SpeedInsights } from "@vercel/speed-insights/next"; // 3. Added Speed Insights
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// BRANDED METADATA
export const metadata: Metadata = {
  title: "OffboardPro | Secure Freelance Offboarding",
  description: "Track client access and exit every project cleanly without storing passwords. Professionalize your freelance exit.",
  icons: {
    icon: [
      { url: "/icon.png", href: "/icon.png" },
    ],
    apple: [
      { url: "/icon.png", href: "/icon.png" },
    ],
  },
};

// MOBILE OPTIMIZATION
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
      >
        {children}

        {/* 2. Razorpay Checkout Script - Loaded with 'lazyOnload' to keep your initial load fast */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        {/* 4. Vercel Speed Insights Component */}
        <SpeedInsights />
      </body>
    </html>
  );
}