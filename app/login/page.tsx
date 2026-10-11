"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// OffboardPro brand colors
const NAVY = "#243F74";
const GREEN = "#9BCB3B";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Synchronize the authenticated user with Firestore.
  const syncUserToFirestore = async (user: {
    uid: string;
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }) => {
    const userRef = doc(db, "users", user.uid);

    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "User",
        photoURL: user.photoURL || null,
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Email and password login.
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setResetMessage("");

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await syncUserToFirestore(userCredential.user);

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Firebase Auth Error:", error);

      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
          setErrorMessage(
            "Incorrect email or password. Please try again."
          );
          break;

        case "auth/user-not-found":
          setErrorMessage("No account was found with this email.");
          break;

        case "auth/invalid-email":
          setErrorMessage("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setErrorMessage(
            "Too many failed attempts. Please wait a moment and try again."
          );
          break;

        case "auth/network-request-failed":
          setErrorMessage(
            "Network error. Please check your internet connection and try again."
          );
          break;

        default:
          setErrorMessage(
            "Unable to sign in right now. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // Password reset through the existing API route.
  const handleForgotPassword = async () => {
    setErrorMessage("");
    setResetMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Enter your email address first, then click Forgot password."
      );
      return;
    }

    try {
      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Password reset request failed.");
      }

      setResetMessage(
        "If an account exists for this email, you'll receive a password reset link shortly."
      );
    } catch (error) {
      console.error("Password Reset Error:", error);

      setErrorMessage(
        "Unable to send the reset email right now. Please try again."
      );
    }
  };

  // Google login.
  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setResetMessage("");
    setLoading(true);

    const provider = new GoogleAuthProvider();

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const result = await signInWithPopup(auth, provider);

      await syncUserToFirestore(result.user);

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Google Login Error:", error);

      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      switch (code) {
        case "auth/popup-closed-by-user":
          setErrorMessage("Google sign-in was cancelled.");
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
            "Unable to sign in with Google. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white font-sans selection:bg-[#9BCB3B]/20 lg:grid-cols-2">
      {/* LEFT: BRAND PANEL */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-100 bg-slate-50 p-10 md:p-12 lg:flex lg:p-16">
        {/* Decorative background */}
        <div
          className="absolute -right-40 -top-40 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${GREEN}18` }}
        />

        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${NAVY}0D` }}
        />

        <Link
          href="/"
          aria-label="OffboardPro home"
          className="relative z-10 inline-flex w-fit transition-transform hover:scale-[1.02]"
        >
          <Image
            src="/logo.png"
            alt="OffboardPro"
            width={180}
            height={60}
            priority
            className="h-auto object-contain"
          />
        </Link>

        <div className="relative z-10 max-w-xl py-12">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2"
            style={{
              borderColor: `${GREEN}55`,
              backgroundColor: `${GREEN}15`,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: GREEN }}
            />

            <span
              className="text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ color: NAVY }}
            >
              Welcome to OffboardPro
            </span>
          </div>

          <h2
            className="mb-6 text-5xl font-black italic leading-tight tracking-tight md:text-6xl"
            style={{ color: NAVY }}
          >
            Secure your
            <br />
            <span style={{ color: GREEN }}>freelance exit.</span>
          </h2>

          <p className="max-w-md text-base leading-8 text-slate-500 md:text-lg">
            Keep client offboarding organized. Track the tools, manage
            your checklist, and stay on top of access-removal deadlines.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Organize client offboarding in one place",
              "Track tasks and completion progress",
              "Stay aware of important deadlines",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${GREEN}25`, color: NAVY }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </span>

                <span className="text-sm font-semibold text-slate-600">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          Professional client offboarding, made organized.
        </p>
      </section>

      {/* RIGHT: LOGIN FORM */}
      <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10 lg:min-h-screen lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <Link href="/" aria-label="OffboardPro home">
              <Image
                src="/logo.png"
                alt="OffboardPro"
                width={155}
                height={52}
                priority
                className="h-auto object-contain"
              />
            </Link>

            <div
              className="mt-4 h-1 w-10 rounded-full"
              style={{ backgroundColor: GREEN }}
            />
          </div>

          {/* Heading */}
          <div className="mb-9 text-center">
            <h1
              className="mb-3 text-3xl font-black tracking-tight sm:text-4xl"
              style={{ color: NAVY }}
            >
              Welcome back
            </h1>

            <p className="text-sm leading-6 text-slate-500 sm:text-base">
              Sign in to manage your client offboarding.
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Google login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt=""
                aria-hidden="true"
                className="h-5 w-5 object-contain"
              />

              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-slate-100" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Or continue with email
              </span>

              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 ml-1 block text-xs font-bold text-slate-600"
              >
                Email address
              </label>

              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white"
                style={
                  {
                    "--tw-ring-color": GREEN,
                  } as React.CSSProperties
                }
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = GREEN;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${GREEN}25`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-2 ml-1 block text-xs font-bold text-slate-600"
              >
                Password
              </label>

              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = GREEN;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${GREEN}25`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>

            {/* Remember me / Forgot password */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-slate-500">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: GREEN }}
                  className="h-4 w-4 rounded border-slate-300"
                />

                Remember me
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="font-bold transition-colors hover:underline disabled:opacity-50"
                style={{ color: NAVY }}
              >
                Forgot password?
              </button>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {errorMessage}
              </div>
            )}

            {/* Password reset message */}
            {resetMessage && (
              <div
                role="status"
                className="rounded-xl border px-4 py-3 text-sm leading-6"
                style={{
                  borderColor: `${GREEN}55`,
                  backgroundColor: `${GREEN}15`,
                  color: NAVY,
                }}
              >
                {resetMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: NAVY,
                boxShadow: `0 10px 25px ${NAVY}20`,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Signup link */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold transition-colors hover:underline"
              style={{ color: NAVY }}
            >
              Create one for free
            </Link>
          </p>

          {/* Legal links */}
          <div className="mt-10 flex items-center justify-center gap-5 text-xs text-slate-400">
            <Link
              href="/privacy"
              className="transition-colors hover:text-slate-700"
            >
              Privacy
            </Link>

            <span aria-hidden="true">·</span>

            <Link
              href="/terms"
              className="transition-colors hover:text-slate-700"
            >
              Terms
            </Link>

            <span aria-hidden="true">·</span>

            <Link
              href="/refund-policy"
              className="transition-colors hover:text-slate-700"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}