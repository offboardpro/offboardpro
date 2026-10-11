"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync user information to Firestore
  const syncUserToFirestore = async (
    user: any,
    customName?: string
  ) => {
    const userRef = doc(db, "users", user.uid);

    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: customName || user.displayName || "User",
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Trigger welcome email
  const triggerWelcomeEmail = async (
    userEmail: string | null,
    userName: string | null
  ) => {
    if (!userEmail) return;

    try {
      const response = await fetch("/api/welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName || "Freelancer",
        }),
      });

      if (!response.ok) {
        console.error(
          "Welcome email request failed:",
          response.status
        );
      }
    } catch (error) {
      // Welcome email failure should not prevent account creation.
      console.error("Failed to trigger welcome email:", error);
    }
  };

  // Email and password signup
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: trimmedName,
      });

      await syncUserToFirestore(
        {
          ...userCredential.user,
          displayName: trimmedName,
        },
        trimmedName
      );

      // Send welcome email without blocking the redirect.
      void triggerWelcomeEmail(
        normalizedEmail,
        trimmedName
      );

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup Error:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          setErrorMessage(
            "An account with this email already exists. Try logging in instead."
          );
          break;

        case "auth/invalid-email":
          setErrorMessage("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setErrorMessage(
            "Password must be at least 6 characters."
          );
          break;

        case "auth/network-request-failed":
          setErrorMessage(
            "Network error. Please check your connection and try again."
          );
          break;

        default:
          setErrorMessage(
            "Unable to create your account right now. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // Google signup
  const handleGoogleSignUp = async () => {
    setErrorMessage("");
    setLoading(true);

    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      await syncUserToFirestore(result.user);

      // Send welcome email without blocking the redirect.
      void triggerWelcomeEmail(
        result.user.email,
        result.user.displayName || "User"
      );

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google Signup Error:", error);

      switch (error.code) {
        case "auth/popup-closed-by-user":
          setErrorMessage("Google sign-up was cancelled.");
          break;

        case "auth/popup-blocked":
          setErrorMessage(
            "Your browser blocked the Google sign-in popup. Please allow popups and try again."
          );
          break;

        case "auth/network-request-failed":
          setErrorMessage(
            "Network error. Please check your connection and try again."
          );
          break;

        default:
          setErrorMessage(
            "Unable to sign up with Google. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white font-sans selection:bg-[#9BCB3B]/20">
      {/* LEFT BRAND PANEL — DESKTOP ONLY */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-slate-50 border-r border-slate-100 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#9BCB3B]/10 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link
          href="/"
          aria-label="OffboardPro home"
          className="relative z-10 w-fit transition-transform hover:scale-[1.02]"
        >
          <Image
            src="/logo.png"
            alt="OffboardPro"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
        </Link>

        {/* Brand messaging */}
        <div className="relative z-10 max-w-xl py-12">
          <div className="mb-6 h-1 w-12 rounded-full bg-[#9BCB3B]" />

          <h2
            style={{ color: "#243F74" }}
            className="text-5xl xl:text-6xl font-black leading-tight mb-6 tracking-tight italic"
          >
            Start your
            <br />
            <span style={{ color: "#9BCB3B" }}>
              secure journey.
            </span>
          </h2>

          <p className="text-slate-500 text-base xl:text-lg max-w-md leading-relaxed font-medium">
            Keep client offboarding organized, track access removal,
            and stay on top of every deadline.
          </p>

          {/* Product benefits */}
          <div className="mt-8 space-y-4">
            {[
              "Organize client projects and tracked tools",
              "Follow structured offboarding checklists",
              "Keep deadlines and outstanding tasks visible",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9BCB3B]/15 text-[#5F8318] text-xs font-black">
                  ✓
                </span>

                <span className="text-sm font-semibold text-slate-600">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* No copyright footer */}
        <div className="relative z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-[#9BCB3B]" />
          Client Offboarding, Organized
        </div>
      </div>

      {/* RIGHT SIGNUP PANEL */}
      <div className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 md:px-16 bg-white relative">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-9 lg:hidden flex flex-col items-center">
            <Link href="/" aria-label="OffboardPro home">
              <Image
                src="/logo.png"
                alt="OffboardPro"
                width={150}
                height={50}
                className="mb-4 object-contain"
                priority
              />
            </Link>

            <div className="h-1 w-10 rounded-full bg-[#9BCB3B]" />
          </div>

          {/* Centered heading */}
          <div className="mb-8 text-center">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#7C9F2D]">
              Welcome to OffboardPro
            </p>

            <h1
              style={{ color: "#243F74" }}
              className="text-4xl sm:text-5xl font-black tracking-tight mb-3 italic"
            >
              Create Account
            </h1>

            <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
              Create your free account to get started.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* GOOGLE SIGNUP */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full py-4 px-6 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[#243F74] font-bold text-sm hover:bg-slate-50 hover:border-[#9BCB3B] transition-all active:scale-[0.98] shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 object-contain transition-transform group-hover:scale-110"
              />

              Sign up with Google
            </button>

            {/* DIVIDER */}
            <div className="relative py-2 flex items-center gap-4">
              <div className="flex-grow border-t border-slate-200" />

              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                or continue with email
              </span>

              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* INPUT FIELDS */}
            <div className="space-y-4">
              {/* FULL NAME */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 ml-1"
                >
                  Full Name
                </label>

                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-[#9BCB3B] focus:bg-white focus:ring-4 focus:ring-[#9BCB3B]/10 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 ml-1"
                >
                  Email Address
                </label>

                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-[#9BCB3B] focus:bg-white focus:ring-4 focus:ring-[#9BCB3B]/10 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 ml-1"
                >
                  Password
                </label>

                <input
                  id="signup-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (6+ characters)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-[#9BCB3B] focus:bg-white focus:ring-4 focus:ring-[#9BCB3B]/10 transition-all font-medium placeholder:text-slate-400"
                />

                <p className="mt-2 ml-1 text-xs text-slate-400">
                  Use at least 6 characters.
                </p>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {errorMessage}

                {errorMessage.includes("already exists") && (
                  <Link
                    href="/login"
                    className="ml-1 font-black underline underline-offset-4"
                  >
                    Log in
                  </Link>
                )}
              </div>
            )}

            {/* CREATE ACCOUNT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#243F74" }}
              className="w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#243F74]/15 hover:bg-[#1C315B] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating Account...
                </span>
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          {/* LOGIN LINK */}
          <p className="text-center mt-8 text-sm font-medium text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "#243F74" }}
              className="font-black underline decoration-[#9BCB3B] decoration-2 underline-offset-4 hover:text-[#7C9F2D] transition-colors ml-1"
            >
              Log in
            </Link>
          </p>

          {/* No website footer on the signup page */}
        </div>
      </div>
    </div>
  );
}