"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useShortlist } from "@/context/ShortlistContext";
import { Language } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export function Header({ onOpenContact }: { onOpenContact?: (target: string, type: "club" | "player") => void }) {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { shortlistCount } = useShortlist();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function checkUserProfile(currentUser: { email?: string; id?: string } | null) {
      if (!currentUser?.email && !currentUser?.id) {
        if (!isCancelled) setHasProfile(null);
        return;
      }

      const email = currentUser.email?.toLowerCase().trim();

      try {
        // 1. Check players table
        let playerQuery = supabase.from("players").select("id").limit(1);
        if (email) {
          playerQuery = playerQuery.ilike("email", email);
        }
        const { data: playerData } = await playerQuery.maybeSingle();

        if (playerData) {
          if (!isCancelled) setHasProfile(true);
          return;
        }

        // 2. Check club_ads table (by contact_email)
        if (email) {
          const { data: clubData } = await supabase
            .from("club_ads")
            .select("id")
            .ilike("contact_email", email)
            .limit(1)
            .maybeSingle();

          if (clubData) {
            if (!isCancelled) setHasProfile(true);
            return;
          }
        }

        if (!isCancelled) setHasProfile(false);
      } catch (err) {
        console.error("Error checking user profile in Header:", err);
        if (!isCancelled) setHasProfile(false);
      }
    }

    checkUserProfile(user);

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasProfile(null);
    router.push("/");
    router.refresh();
  };

  const languagesList: { code: Language; name: string; flag: string }[] = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "sv", name: "Svenska", flag: "🇸🇪" },
    { code: "fi", name: "Suomi", flag: "🇫🇮" },
    { code: "no", name: "Norsk", flag: "🇳🇴" },
    { code: "nl", name: "Nederlands", flag: "🇳🇱" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ];

  return (
    <>
      {/* Top Banner */}
      <div className="bg-zinc-900 text-zinc-300 text-xs px-4 py-2 border-b border-zinc-800 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="font-medium text-zinc-200">{t.topBanner}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-tight group-hover:bg-zinc-800 transition-colors">
                  BP
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-zinc-950">Bandyprospects</span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
                <Link
                  href="/players"
                  className={`transition-colors hover:text-zinc-950 ${
                    pathname?.startsWith("/players") ? "text-zinc-950 font-bold" : ""
                  }`}
                >
                  {t.nav.players}
                </Link>
                <Link
                  href="/market"
                  className={`transition-colors hover:text-zinc-950 ${
                    pathname === "/market" ? "text-zinc-950 font-bold" : ""
                  }`}
                >
                  {t.nav.market}
                </Link>
                <Link
                  href="/#how-it-works"
                  className="transition-colors hover:text-zinc-950"
                >
                  {t.nav.howItWorks}
                </Link>
                <Link
                  href="/#about"
                  className="transition-colors hover:text-zinc-950"
                >
                  {t.nav.about}
                </Link>
              </nav>
            </div>

            {/* Language & Actions */}
            <div className="flex items-center gap-3">
              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-md border border-zinc-200/80 transition-colors cursor-pointer"
                  aria-label="Change language"
                >
                  <span>{t.flag}</span>
                  <span className="uppercase tracking-wider">{lang}</span>
                  <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {languagesList.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => {
                          setLang(item.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          lang === item.code ? "bg-zinc-100 font-bold text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{item.flag}</span>
                          <span>{item.name}</span>
                        </span>
                        {lang === item.code && <span className="text-zinc-900 font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Authentication Status / Shortlist / Profile Links */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/shortlist"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      pathname === "/shortlist"
                        ? "bg-amber-100 text-amber-950 border-amber-300 font-bold"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                    }`}
                  >
                    <span>⭐</span>
                    <span>Shortlist</span>
                    {shortlistCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-zinc-900 text-white text-[10px] font-bold">
                        {shortlistCount}
                      </span>
                    )}
                  </Link>

                  {hasProfile === true && (
                    <Link
                      href="/my-profile"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                        pathname === "/my-profile"
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                      }`}
                    >
                      <span>👤</span>
                      <span>{lang === "sv" ? "Min profil" : "My Profile"}</span>
                    </Link>
                  )}

                  {hasProfile === false && (
                    <div className="flex items-center gap-2">
                      <div
                        className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-600 bg-zinc-100 rounded-md border border-zinc-200 max-w-[150px]"
                        title={user.email}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{user.email}</span>
                      </div>
                      <Link
                        href="/join"
                        className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-zinc-900 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition-colors"
                      >
                        + {lang === "sv" ? "Skapa profil" : "Create Profile"}
                      </Link>
                    </div>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="px-2 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                  >
                    {lang === "sv" ? "Logga ut" : "Log out"}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className={`hidden sm:inline-flex px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    pathname === "/login" ? "text-zinc-950 font-bold" : "text-zinc-700 hover:text-zinc-950"
                  }`}
                >
                  {lang === "sv"
                    ? "Logga in / Redigera profil"
                    : lang === "fi"
                    ? "Kirjaudu / Muokkaa"
                    : lang === "no"
                    ? "Logg inn / Rediger"
                    : "Sign in / Edit Profile"}
                </Link>
              )}

              {!user && (
                <Link
                  href="/join"
                  className="hidden md:inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-md border border-zinc-200 transition-colors"
                >
                  {lang === "sv" ? "Skapa profil" : lang === "fi" ? "Luo profiili" : lang === "no" ? "Opprett profil" : "Join as Player"}
                </Link>
              )}

              <Link
                href="/post-ad"
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-sm transition-colors cursor-pointer"
              >
                {lang === "sv" ? "+ Klubbannons" : lang === "fi" ? "+ Jätä ilmoitus" : lang === "no" ? "+ Klubbannonse" : "+ Post Club Ad"}
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-zinc-600 hover:text-zinc-900 rounded-md border border-zinc-200"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-zinc-200 space-y-1">
              <Link
                href="/players"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md"
              >
                {t.nav.players}
              </Link>
              <Link
                href="/market"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md"
              >
                {t.nav.market}
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md"
              >
                {t.nav.howItWorks}
              </Link>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md"
              >
                {t.nav.about}
              </Link>

              {user ? (
                <div className="pt-2 border-t border-zinc-100 space-y-1">
                  <Link
                    href="/shortlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm font-bold text-amber-950 bg-amber-50 rounded-md border border-amber-200"
                  >
                    <span>⭐ {lang === "sv" ? "Min Shortlist" : "My Shortlist"}</span>
                    {shortlistCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-xs font-bold">
                        {shortlistCount}
                      </span>
                    )}
                  </Link>
                  {hasProfile === true ? (
                    <Link
                      href="/my-profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-zinc-900 bg-zinc-100 rounded-md"
                    >
                      👤 {lang === "sv" ? "Min profil" : "My Profile"}
                    </Link>
                  ) : (
                    <div className="space-y-1.5 py-1">
                      <div className="px-3 py-2 text-xs text-zinc-600 bg-zinc-50 rounded-md border border-zinc-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{user.email}</span>
                      </div>
                      <Link
                        href="/join"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200"
                      >
                        + {lang === "sv" ? "Skapa profil" : "Create Profile"}
                      </Link>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-md"
                  >
                    {lang === "sv" ? "Logga ut" : "Log out"}
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-zinc-100">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md"
                  >
                    {lang === "sv" ? "Logga in / Redigera profil" : "Sign In / Edit Profile"}
                  </Link>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-2">
                <Link
                  href="/join"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-center text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200"
                >
                  {lang === "sv" ? "Skapa profil" : lang === "fi" ? "Luo profiili" : lang === "no" ? "Opprett profil" : "Join as Player"}
                </Link>
                <Link
                  href="/post-ad"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-center text-xs font-semibold rounded-lg bg-zinc-900 text-white"
                >
                  {lang === "sv" ? "+ Klubbannons" : lang === "fi" ? "+ Jätä ilmoitus" : lang === "no" ? "+ Klubbannonse" : "+ Post Club Ad"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
