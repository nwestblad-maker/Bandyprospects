"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
        router.push(nextParam);
        router.refresh();
      } else {
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

  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            <span>Account Registration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Create Account
          </h1>

          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Create a Bandy Prospects account with email and password to manage your profile and save shortlisted prospects.
          </p>
        </div>

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

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <span>
              {loading ? "Creating Account..." : "Create Account →"}
            </span>
          </button>
        </form>

        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <span>Already have an account?{" "}</span>
          <Link href="/login" className="font-bold text-slate-900 hover:underline cursor-pointer">
            Sign In here →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
