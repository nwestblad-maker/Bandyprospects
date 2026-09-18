"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const nextParam = searchParams.get("next") || "/my-profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push(nextParam);
      }
    });
  }, [router, nextParam]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage(
        lang === "sv" ? "Vänligen ange en giltig e-postadress." : "Please enter a valid email address."
      );
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(
        lang === "sv"
          ? "Lösenordet måste vara minst 6 tecken långt."
          : "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(lang === "sv" ? "Lösenorden stämmer inte överens." : "Passwords do not match.");
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
        router.push(nextParam);
        router.refresh();
      } else {
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

  return (
    <div className="max-w-md w-full">
      <div className="bg-white border border-zinc-200 rounded-2xl p-7 sm:p-9 shadow-xs">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Account Registration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            {lang === "sv" ? "Skapa konto" : "Create Account"}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
            {lang === "sv"
              ? "Skapa ett BP-konto med e-post och lösenord för att hantera din profil och spara intressanta spelare."
              : "Create a BP account with email and password to manage your profile and save shortlisted prospects."}
          </p>
        </div>

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

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {lang === "sv" ? "E-postadress" : "Email Address"}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn@exempel.se"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              {lang === "sv" ? "Lösenord (minst 6 tecken)" : "Password (min. 6 characters)"}
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
            <span>
              {loading
                ? lang === "sv"
                  ? "Skapar konto..."
                  : "Creating Account..."
                : lang === "sv"
                ? "Skapa konto →"
                : "Create Account →"}
            </span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-100 text-center text-xs text-zinc-500">
          <span>{lang === "sv" ? "Har du redan ett konto?" : "Already have an account?"}{" "}</span>
          <Link href="/login" className="font-bold text-zinc-900 hover:underline cursor-pointer">
            {lang === "sv" ? "Logga in här" : "Sign In here"} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-xs text-zinc-400">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
