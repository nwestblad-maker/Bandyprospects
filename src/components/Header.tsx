"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useShortlist } from "@/context/ShortlistContext";
import { supabase } from "@/lib/supabaseClient";

export function Header({ onOpenContact }: { onOpenContact?: (target: string, type: "club" | "player") => void }) {
  const router = useRouter();
  const { shortlistCount } = useShortlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileInfo, setProfileInfo] = useState<{
    role: "player" | "club";
    name: string;
  } | null>(null);
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
        if (!isCancelled) {
          setHasProfile(null);
          setProfileInfo(null);
        }
        return;
      }

      const email = currentUser.email?.toLowerCase().trim();
      const userId = currentUser.id;

      try {
        // 1. Check players table
        let playerQuery = supabase.from("players").select("id, first_name, last_name").limit(1);
        if (userId && email) {
          playerQuery = playerQuery.or(`user_id.eq.${userId},email.ilike.${email}`);
        } else if (email) {
          playerQuery = playerQuery.ilike("email", email);
        } else if (userId) {
          playerQuery = playerQuery.eq("user_id", userId);
        }
        const { data: playerData } = await playerQuery.maybeSingle();

        if (playerData) {
          const playerName = `${playerData.first_name || ""} ${playerData.last_name || ""}`.trim() || "Player";
          if (!isCancelled) {
            setHasProfile(true);
            setProfileInfo({ role: "player", name: playerName });
          }
          return;
        }

        // 2. Check club_ads table (by user_id or contact_email)
        let clubQuery = supabase.from("club_ads").select("id, club_name, contact_name").limit(1);
        if (userId && email) {
          clubQuery = clubQuery.or(`user_id.eq.${userId},contact_email.ilike.${email}`);
        } else if (email) {
          clubQuery = clubQuery.ilike("contact_email", email);
        } else if (userId) {
          clubQuery = clubQuery.eq("user_id", userId);
        }
        const { data: clubData } = await clubQuery.maybeSingle();

        if (clubData) {
          const clubName = clubData.club_name || clubData.contact_name || "Club";
          if (!isCancelled) {
            setHasProfile(true);
            setProfileInfo({ role: "club", name: clubName });
          }
          return;
        }

        // 3. Check user_profiles table (for registered club accounts)
        if (userId) {
          const { data: userProfileData } = await supabase
            .from("user_profiles")
            .select("club_name, display_name, role")
            .eq("id", userId)
            .maybeSingle();

          if (userProfileData) {
            const clubName = userProfileData.club_name || userProfileData.display_name || "Club";
            if (!isCancelled) {
              setHasProfile(true);
              setProfileInfo({
                role: userProfileData.role === "player" ? "player" : "club",
                name: clubName,
              });
            }
            return;
          }
        }

        if (!isCancelled) {
          setHasProfile(false);
          setProfileInfo(null);
        }
      } catch (err) {
        console.error("Error checking user profile in Header:", err);
        if (!isCancelled) {
          setHasProfile(false);
          setProfileInfo(null);
        }
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
    setProfileInfo(null);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="font-medium text-slate-200">
            Transfer window open for season 2026/27. Connect with international clubs and prospects.
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-colors">
        <div className="flex items-center justify-between h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Zone 1 (Left - Brand) */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight group-hover:bg-slate-800 transition-colors">
                BP
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-950">
                Bandyprospects
              </span>
            </Link>
          </div>

          {/* Zone 2 (Center - Navigation Links) */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/players"
              className={`whitespace-nowrap transition-colors ${
                pathname?.startsWith("/players")
                  ? "text-slate-950 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Players
            </Link>
            <Link
              href="/market"
              className={`whitespace-nowrap transition-colors ${
                pathname === "/market"
                  ? "text-slate-950 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Club Listings
            </Link>
            <Link
              href="/statistik"
              className={`whitespace-nowrap transition-colors ${
                pathname?.startsWith("/statistik") || pathname?.startsWith("/stats")
                  ? "text-slate-950 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Insights
            </Link>
            <Link
              href="/#how-it-works"
              className="text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/#about"
              className="text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Zone 3 (Right - User Actions) */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {user ? (
              /* Logged-In State */
              <div className="hidden sm:flex items-center space-x-3">
                {/* Messages (Subtle icon/pill button) */}
                <Link
                  href="/messages"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    pathname?.startsWith("/messages")
                      ? "bg-slate-100 text-slate-950 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>✉️</span>
                  <span>Messages</span>
                </Link>

                {/* Shortlist (Subtle icon/pill button) */}
                <Link
                  href="/shortlist"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    pathname === "/shortlist"
                      ? "bg-slate-100 text-slate-950 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>⭐</span>
                  <span>Shortlist</span>
                  {shortlistCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
                      {shortlistCount}
                    </span>
                  )}
                </Link>

                {/* Conditional Action Button: Player vs Club */}
                {profileInfo?.role === "club" ? (
                  <Link
                    href="/post-ad"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>💼</span>
                    <span>+ Post Listing</span>
                  </Link>
                ) : (
                  <Link
                    href="/my-profile"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </Link>
                )}

                {/* Sign Out: clean, single-line text/button */}
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 whitespace-nowrap ml-2 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* Logged-Out / Public State */
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>⛸️</span>
                  <span>Join as Player</span>
                </Link>
                <Link
                  href="/post-ad"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>💼</span>
                  <span>+ Post Club Listing</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 cursor-pointer"
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
          <div className="lg:hidden py-3 border-t border-slate-200 px-4 sm:px-6 space-y-1 bg-white">
            {/* Role indicator if logged in */}
            {user && (
              <div className="pb-2 mb-2 border-b border-slate-100">
                {profileInfo?.role === "player" ? (
                  <div className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 rounded-md border border-emerald-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Signed in as: {profileInfo.name} (Player)</span>
                  </div>
                ) : profileInfo?.role === "club" ? (
                  <div className="px-3 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 rounded-md border border-blue-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">Signed in as: {profileInfo.name} (Club)</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
              </div>
            )}

            <Link
              href="/players"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Players
            </Link>
            <Link
              href="/market"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Club Listings
            </Link>
            <Link
              href="/statistik"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Insights
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              How it Works
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              About
            </Link>

            {user ? (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-md"
                >
                  <span>✉️</span>
                  <span>Messages</span>
                </Link>

                <Link
                  href="/shortlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span>⭐</span>
                    <span>Shortlist</span>
                  </span>
                  {shortlistCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold">
                      {shortlistCount}
                    </span>
                  )}
                </Link>

                {profileInfo?.role === "club" ? (
                  <div className="pt-1">
                    <Link
                      href="/post-ad"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white shadow-sm"
                    >
                      💼 + Post Listing
                    </Link>
                  </div>
                ) : (
                  <div className="pt-1">
                    <Link
                      href="/my-profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50"
                    >
                      👤 My Profile
                    </Link>
                  </div>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-md cursor-pointer pt-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md text-center"
                >
                  Sign In
                </Link>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/join"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-center text-xs font-semibold rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <span>⛸️</span>
                    <span>Join as Player</span>
                  </Link>
                  <Link
                    href="/post-ad"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-center text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors"
                  >
                    <span>💼</span>
                    <span>+ Post Listing</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
