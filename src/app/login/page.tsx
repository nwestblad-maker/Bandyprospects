"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to /my-profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push("/my-profile");
      }
    });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error") || params.get("auth_error") || params.get("error_description");
      if (urlError) {
        setErrorMessage(decodeURIComponent(urlError));
      }
    }
  }, [router]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage(
        lang === "sv"
          ? "Vänligen ange en giltig e-postadress."
          : "Please enter a valid email address."
      );
      return;
    }

    try {
      setLoading(true);

      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/my-profile`
          : "http://localhost:3000/auth/callback?next=/my-profile";

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Supabase OTP error:", error);
        throw new Error(error.message || "Failed to send magic login link.");
      }

      setIsSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-10 shadow-xs">
            {/* Header Badge & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                <span>Magic Link Auth</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                {lang === "sv" && "Logga in / Redigera profil"}
                {lang === "en" && "Sign In / Edit Profile"}
                {lang === "fi" && "Kirjaudu / Muokkaa profiilia"}
                {lang === "no" && "Logg inn / Rediger profil"}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
                {lang === "sv" &&
                  "Fyll i e-postadressen du använde när du registrerade din profil. Vi skickar en direktlänk – inga lösenord behövs."}
                {lang === "en" &&
                  "Enter the email address you registered your profile with. We will send a secure magic login link — no passwords required."}
                {lang === "fi" &&
                  "Syötä sähköpostiosoite, jolla rekisteröit profiilisi. Lähetämme suoran kirjautumislinkin ilman salasanaa."}
                {lang === "no" &&
                  "Fyll inn e-postadressen du registrerte profilen din med. Vi sender en sikker innloggingslenke."}
              </p>
            </div>

            {/* Success state */}
            {isSent ? (
              <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✉️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {lang === "sv" ? "Kolla din inkorg!" : "Check your inbox!"}
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed max-w-xs mx-auto">
                    {lang === "sv" && (
                      <>
                        Vi har skickat en engångslänk till <span className="font-semibold text-zinc-900">{email}</span>. Klicka på länken i mejlet för att logga in och redigera din profil direkt.
                      </>
                    )}
                    {lang === "en" && (
                      <>
                        We sent a magic link to <span className="font-semibold text-zinc-900">{email}</span>. Click the link in the email to log in and edit your profile.
                      </>
                    )}
                    {lang === "fi" && (
                      <>
                        Lähetimme kirjautumislinkin osoitteeseen <span className="font-semibold text-zinc-900">{email}</span>.
                      </>
                    )}
                    {lang === "no" && (
                      <>
                        Vi har sendt en magisk lenke til <span className="font-semibold text-zinc-900">{email}</span>.
                      </>
                    )}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSent(false);
                      setEmail("");
                    }}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 underline cursor-pointer"
                  >
                    {lang === "sv" ? "Skicka till en annan e-postadress" : "Send to another email address"}
                  </button>
                </div>
              </div>
            ) : (
              /* Input form */
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                    <span>⚠️ {errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      className="font-bold text-rose-900 hover:underline"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    {lang === "sv" ? "Din e-postadress" : "Your email address"}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {lang === "sv" && (loading ? "Skickar länk..." : "Skicka inloggningslänk →")}
                    {lang === "en" && (loading ? "Sending link..." : "Send Magic Link →")}
                    {lang === "fi" && (loading ? "Lähetetään..." : "Lähetä kirjautumislinkki →")}
                    {lang === "no" && (loading ? "Sender lenke..." : "Send magisk lenke →")}
                  </span>
                </button>
              </form>
            )}

            {/* Bottom prompt to register */}
            <div className="mt-8 pt-6 border-t border-zinc-100 text-center text-xs text-zinc-500">
              <span>
                {lang === "sv" ? "Har du ingen spelarprofil än?" : "Don't have a player profile yet?"}{" "}
              </span>
              <Link
                href="/join"
                className="font-bold text-zinc-900 hover:underline cursor-pointer"
              >
                {lang === "sv" ? "Registrera dig gratis här" : "Register for free here"} →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
