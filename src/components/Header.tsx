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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight group-hover:bg-slate-800 transition-colors">
                  BP
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-slate-950">Bandyprospects</span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-8 text-base font-medium text-slate-700">
                <Link
                  href="/players"
                  className={`text-base font-medium text-slate-700 hover:text-slate-900 transition-colors ${
                    pathname?.startsWith("/players") ? "text-slate-950 font-bold" : ""
                  }`}
                >
                  Players
                </Link>
                <Link
                  href="/market"
                  className={`text-base font-medium text-slate-700 hover:text-slate-900 transition-colors ${
                    pathname === "/market" ? "text-slate-950 font-bold" : ""
                  }`}
                >
                  Club Listings
                </Link>
                <Link
                  href="/statistik"
                  className={`text-base font-medium text-slate-700 hover:text-slate-900 transition-colors ${
                    pathname?.startsWith("/statistik") || pathname?.startsWith("/stats") ? "text-slate-950 font-bold" : ""
                  }`}
                >
                  Insights
                </Link>
                <Link
                  href="/#how-it-works"
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  How it Works
                </Link>
                <Link
                  href="/#about"
                  className="text-base font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  About
                </Link>
              </nav>
            </div>

            {/* Desktop Actions & Role */}
            <div className="flex items-center gap-2.5">
              {/* User Authentication Status / Links */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {/* Role Indicator Badge */}
                  {profileInfo?.role === "player" && (
                    <div
                      className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-950 bg-emerald-50 rounded-md border border-emerald-200"
                      title={profileInfo.name}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        Signed in as: <strong>{profileInfo.name}</strong> (Player)
                      </span>
                    </div>
                  )}

                  {profileInfo?.role === "club" && (
                    <div
                      className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-950 bg-blue-50 rounded-md border border-blue-200"
                      title={profileInfo.name}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        Signed in as: <strong>{profileInfo.name}</strong> (Club)
                      </span>
                    </div>
                  )}

                  {/* Messages Link */}
                  <Link
                    href="/messages"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      pathname?.startsWith("/messages")
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span>✉️</span>
                    <span>Messages</span>
                  </Link>

                  {/* Shortlist Link */}
                  <Link
                    href="/shortlist"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      pathname === "/shortlist"
                        ? "bg-amber-100 text-amber-950 border-amber-300 font-bold"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span>⭐</span>
                    <span>Shortlist</span>
                    {shortlistCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                        {shortlistCount}
                      </span>
                    )}
                  </Link>

                  {/* PLAYER: Show "My Profile", DO NOT show "+ Post Club Listing" */}
                  {profileInfo?.role === "player" && (
                    <Link
                      href="/my-profile"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                        pathname === "/my-profile"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                      }`}
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </Link>
                  )}

                  {/* CLUB: Show "My Listings" and "+ Post Club Listing", DO NOT show "Join as Player" */}
                  {profileInfo?.role === "club" && (
                    <>
                      <Link
                        href={profileInfo.name ? `/market?search=${encodeURIComponent(profileInfo.name)}` : "/market"}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                          pathname === "/market"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                        }`}
                      >
                        <span>📋</span>
                        <span>My Listings</span>
                      </Link>
                      <Link
                        href="/post-ad"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        <span>💼</span>
                        <span>+ Post Club Listing</span>
                      </Link>
                    </>
                  )}

                  {/* Fallback if user profile is pending / not yet created */}
                  {hasProfile === false && (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/join"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
                      >
                        <span>⛸️</span>
                        <span>Join as Player</span>
                      </Link>
                      <Link
                        href="/post-ad"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        <span>💼</span>
                        <span>+ Post Club Listing</span>
                      </Link>
                    </div>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer ml-1"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                /* PUBLIC / LOGGED-OUT STATE */
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    href="/login"
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      pathname === "/login" ? "text-slate-950 font-bold" : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    Sign In
                  </Link>
                  {/* Button 1 (Player target): light/neutral button with skater icon */}
                  <Link
                    href="/join"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 shadow-2xs transition-colors"
                  >
                    <span>⛸️</span>
                    <span>Join as Player</span>
                  </Link>
                  {/* Button 2 (Club target): distinct primary/accent button with club/briefcase icon */}
                  <Link
                    href="/post-ad"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <span>💼</span>
                    <span>+ Post Club Listing</span>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md border border-slate-200"
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
            <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
              {/* Role badge if logged in */}
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
                  {/* Role Indicator Badge */}
                  {profileInfo?.role === "player" && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 rounded-md border border-emerald-200">
                      Signed in as: <strong>{profileInfo.name}</strong> (Player)
                    </div>
                  )}
                  {profileInfo?.role === "club" && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 rounded-md border border-blue-200">
                      Signed in as: <strong>{profileInfo.name}</strong> (Club)
                    </div>
                  )}

                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-900 bg-slate-100 rounded-md"
                  >
                    <span>✉️</span>
                    <span>Messages</span>
                  </Link>

                  <Link
                    href="/shortlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm font-bold text-amber-950 bg-amber-50 rounded-md border border-amber-200"
                  >
                    <span>⭐ My Shortlist</span>
                    {shortlistCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold">
                        {shortlistCount}
                      </span>
                    )}
                  </Link>

                  {/* PLAYER: Show "My Profile", DO NOT show "+ Post Club Listing" */}
                  {profileInfo?.role === "player" && (
                    <Link
                      href="/my-profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100 rounded-md"
                    >
                      👤 My Profile
                    </Link>
                  )}

                  {/* CLUB: Show "My Listings" & "+ Post Club Listing", DO NOT show "Join as Player" */}
                  {profileInfo?.role === "club" && (
                    <div className="space-y-1.5 pt-1">
                      <Link
                        href={profileInfo.name ? `/market?search=${encodeURIComponent(profileInfo.name)}` : "/market"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100 rounded-md"
                      >
                        📋 My Listings
                      </Link>
                      <Link
                        href="/post-ad"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-center text-xs font-semibold rounded-lg bg-slate-900 text-white shadow-xs"
                      >
                        💼 + Post Club Listing
                      </Link>
                    </div>
                  )}

                  {/* Fallback if user profile is pending / not yet created */}
                  {hasProfile === false && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href="/join"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2 text-center text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        ⛸️ Join as Player
                      </Link>
                      <Link
                        href="/post-ad"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2 text-center text-xs font-semibold rounded-lg bg-slate-900 text-white shadow-xs"
                      >
                        💼 + Post Club Listing
                      </Link>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer pt-2"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                /* Public / Logged-out Mobile */
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md text-center"
                  >
                    Sign In
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/join"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 text-center text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5"
                    >
                      <span>⛸️</span>
                      <span>Join as Player</span>
                    </Link>
                    <Link
                      href="/post-ad"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 text-center text-xs font-semibold rounded-lg bg-slate-900 text-white shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>💼</span>
                      <span>+ Post Listing</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
