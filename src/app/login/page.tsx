"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { resolveEmailFromIdentifier } from "@/lib/authHelpers";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const nextParam = searchParams.get("next") || "/my-profile";

  const [mode, setMode] = useState<"login" | "register" | "forgot_password" | "magic_link">(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect to destination
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push(nextParam);
      }
    });

    const urlError = searchParams.get("error") || searchParams.get("auth_error") || searchParams.get("error_description");
    if (urlError) {
      setErrorMessage(decodeURIComponent(urlError));
    }
  }, [router, nextParam, searchParams]);

  // Handle Login via Email / Username + Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage("Please enter your email or username.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const resolvedEmail = await resolveEmailFromIdentifier(cleanIdentifier);

      if (!resolvedEmail.includes("@")) {
        throw new Error(
          "Could not find an account associated with that username. Please enter your email address."
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        router.push(nextParam);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration via Email + Password
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = identifier.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        // Instant login
        router.push(nextParam);
        router.refresh();
      } else {
        // Confirmation email sent
        setSuccessMessage(
          `Account created! A confirmation link has been sent to ${cleanEmail}. Please check your inbox.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register account.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = identifier.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter your email address to reset your password.");
      return;
    }

    try {
      setLoading(true);
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/my-profile`
          : "http://localhost:3000/auth/callback?next=/my-profile";

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        `Password reset link sent! Check your inbox for ${cleanEmail}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send password reset email.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Secondary Magic Link option
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = identifier.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`
          : "http://localhost:3000/auth/callback?next=/my-profile";

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        `Magic link sent to ${cleanEmail}. Check your inbox to log in.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send magic login link.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Badge */}
        <div className="text-center">
          <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            <span>
              {mode === "register"
                ? "Account Registration"
                : mode === "forgot_password"
                ? "Password Recovery"
                : mode === "magic_link"
                ? "Magic Link Sign In"
                : "Account Authentication"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {mode === "register" && "Create Account"}
            {mode === "login" && "Sign In"}
            {mode === "forgot_password" && "Reset Password"}
            {mode === "magic_link" && "Magic Link Sign In"}
          </h1>

          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {mode === "login" &&
              "Sign in with your email or username and password to manage your profile or scout prospects."}
            {mode === "register" &&
              "Register your account to manage player profiles, club adverts, or save shortlists."}
            {mode === "forgot_password" &&
              "Enter the email associated with your account and we'll send a link to reset your password."}
            {mode === "magic_link" &&
              "We will send a one-time login link directly to your email address."}
          </p>
        </div>

        {/* Auth mode toggle tabs (Login / Register) */}
        {(mode === "login" || mode === "register") && (
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                mode === "register" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback notifications */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold text-rose-900 hover:underline ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="font-bold text-emerald-900 hover:underline ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* PRIMARY FORM: LOGIN */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Email / Username
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com or username"
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? "Signing in..." : "Sign In →"}</span>
            </button>

            {/* Alternative: Magic link option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("magic_link");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
              >
                Or sign in with a one-time Magic Link
              </button>
            </div>
          </form>
        )}

        {/* PRIMARY FORM: REGISTER */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? "Creating Account..." : "Create Account →"}</span>
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot_password" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={identifier.includes("@") ? identifier : ""}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? "Sending..." : "Send Reset Link →"}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950 underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* MAGIC LINK SECONDARY FORM */}
        {mode === "magic_link" && (
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={identifier.includes("@") ? identifier : ""}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? "Sending link..." : "Send Magic Link →"}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-950 underline cursor-pointer"
              >
                ← Back to Password Sign In
              </button>
            </div>
          </form>
        )}

        {/* Bottom prompt to create player profile ad */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <span>
            Looking to publish a player profile?{" "}
          </span>
          <Link href="/join" className="font-bold text-slate-900 hover:underline cursor-pointer">
            Create Profile Ad →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
