"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { resolveEmailFromIdentifier } from "@/lib/authHelpers";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

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
      setErrorMessage(lang === "sv" ? "Vänligen ange e-post eller användarnamn." : "Please enter your email or username.");
      return;
    }
    if (!password) {
      setErrorMessage(lang === "sv" ? "Vänligen ange ditt lösenord." : "Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const resolvedEmail = await resolveEmailFromIdentifier(cleanIdentifier);

      if (!resolvedEmail.includes("@")) {
        throw new Error(
          lang === "sv"
            ? "Kunde inte hitta ett konto kopplat till det användarnamnet. Vänligen ange din e-postadress."
            : "Could not find an account associated with that username. Please enter your email address."
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
      setErrorMessage(lang === "sv" ? "Vänligen ange en giltig e-postadress." : "Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(
        lang === "sv"
          ? "Lösenordet måste bestå av minst 6 tecken."
          : "Password must be at least 6 characters long."
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(lang === "sv" ? "Lösenorden matchar inte." : "Passwords do not match.");
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
          lang === "sv"
            ? `Konto skapat! En bekräftelselänk har skickats till ${cleanEmail}. Kontrollera din inkorg.`
            : `Account created! A confirmation link has been sent to ${cleanEmail}. Please check your inbox.`
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
      setErrorMessage(
        lang === "sv"
          ? "Vänligen ange din e-postadress för att återställa lösenordet."
          : "Please enter your email address to reset your password."
      );
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
        lang === "sv"
          ? `Återställningslänk skickad! Kontrollera inkorgen för ${cleanEmail}.`
          : `Password reset link sent! Check your inbox for ${cleanEmail}.`
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
      setErrorMessage(
        lang === "sv" ? "Vänligen ange en giltig e-postadress." : "Please enter a valid email address."
      );
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
        lang === "sv"
          ? `Engångslänk skickad till ${cleanEmail}. Klicka på länken i mejlet för att logga in.`
          : `Magic link sent to ${cleanEmail}. Check your inbox to log in.`
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
      <div className="bg-white border border-zinc-200 rounded-2xl p-7 sm:p-9 shadow-xs">
        {/* Header Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            {mode === "register" && (lang === "sv" ? "Skapa konto" : "Create Account")}
            {mode === "login" && (lang === "sv" ? "Logga in" : "Sign In")}
            {mode === "forgot_password" && (lang === "sv" ? "Återställ lösenord" : "Reset Password")}
            {mode === "magic_link" && (lang === "sv" ? "Engångslänk via e-post" : "Magic Link Sign In")}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
            {mode === "login" &&
              (lang === "sv"
                ? "Logga in med ditt användarnamn/e-post och lösenord för att administrera din profil eller scouta."
                : "Sign in with your email or username and password to manage your profile or scout prospects.")}
            {mode === "register" &&
              (lang === "sv"
                ? "Registrera ditt konto för att skapa och redigera spelarprofiler eller spara shortlists."
                : "Register your account to manage player profiles, club adverts, or save shortlists.")}
            {mode === "forgot_password" &&
              (lang === "sv"
                ? "Ange e-postadressen kopplad till ditt konto så skickar vi instruktioner för att återställa lösenordet."
                : "Enter the email associated with your account and we'll send a link to reset your password.")}
            {mode === "magic_link" &&
              (lang === "sv"
                ? "Vi skickar en direktlänk till din e-post som loggar in dig automatiskt."
                : "We will send a one-time login link directly to your email address.")}
          </p>
        </div>

        {/* Auth mode toggle tabs (Login / Register) */}
        {(mode === "login" || mode === "register") && (
          <div className="flex bg-zinc-100 p-1 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === "login" ? "bg-white text-zinc-950 shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {lang === "sv" ? "Logga in" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === "register" ? "bg-white text-zinc-950 shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {lang === "sv" ? "Skapa konto" : "Create Account"}
            </button>
          </div>
        )}

        {/* Feedback notifications */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold text-rose-900 hover:underline ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="font-bold text-emerald-900 hover:underline ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* PRIMARY FORM: LOGIN */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === "sv" ? "E-post / Användarnamn" : "Email / Username"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={lang === "sv" ? "namn@exempel.se eller användarnamn" : "name@example.com or username"}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  {lang === "sv" ? "Lösenord" : "Password"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  {lang === "sv" ? "Glömt lösenord?" : "Forgot password?"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? (lang === "sv" ? "Loggar in..." : "Signing in...") : (lang === "sv" ? "Logga in →" : "Sign In →")}</span>
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
                className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
              >
                {lang === "sv" ? "Eller skicka engångslänk (Magic Link)" : "Or sign in with a one-time Magic Link"}
              </button>
            </div>
          </form>
        )}

        {/* PRIMARY FORM: REGISTER */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === "sv" ? "E-postadress" : "Email Address"}
              </label>
              <input
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="namn@exempel.se"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === "sv" ? "Välj ett lösenord (minst 6 tecken)" : "Password (min. 6 characters)"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === "sv" ? "Bekräfta lösenord" : "Confirm Password"}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? (lang === "sv" ? "Skapar konto..." : "Creating Account...") : (lang === "sv" ? "Skapa konto →" : "Create Account →")}</span>
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot_password" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === "sv" ? "Din e-postadress" : "Your Email Address"}
              </label>
              <input
                type="email"
                required
                value={identifier.includes("@") ? identifier : ""}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="namn@exempel.se"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? (lang === "sv" ? "Skickar..." : "Sending...") : (lang === "sv" ? "Skicka återställningslänk →" : "Send Reset Link →")}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 underline cursor-pointer"
              >
                ← {lang === "sv" ? "Tillbaka till inloggning" : "Back to Sign In"}
              </button>
            </div>
          </form>
        )}

        {/* MAGIC LINK SECONDARY FORM */}
        {mode === "magic_link" && (
          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                {lang === "sv" ? "Din e-postadress" : "Your Email Address"}
              </label>
              <input
                type="email"
                required
                value={identifier.includes("@") ? identifier : ""}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="namn@exempel.se"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? (lang === "sv" ? "Skickar länk..." : "Sending link...") : (lang === "sv" ? "Skicka inloggningslänk →" : "Send Magic Link →")}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 underline cursor-pointer"
              >
                ← {lang === "sv" ? "Tillbaka till lösenordsinloggning" : "Back to Password Sign In"}
              </button>
            </div>
          </form>
        )}

        {/* Bottom prompt to create player profile ad */}
        <div className="mt-8 pt-6 border-t border-zinc-100 text-center text-xs text-zinc-500">
          <span>
            {lang === "sv" ? "Vill du lägga upp en spelarannons?" : "Looking to publish a player profile?"}{" "}
          </span>
          <Link href="/join" className="font-bold text-zinc-900 hover:underline cursor-pointer">
            {lang === "sv" ? "Skapa profilannons här" : "Create Profile Ad"} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-xs text-zinc-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
