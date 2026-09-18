"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModal } from "@/components/ContactModal";
import { useLanguage } from "@/context/LanguageContext";
import { ClubAd, PlayerProfile } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { transformSupabasePlayer, transformSupabaseClubAd, SupabasePlayerRow, SupabaseClubAdRow } from "@/lib/dataMappers";
import SocialLinks from "@/components/SocialLinks";
import { formatWish } from "@/lib/formatters";
import { LatestTransfersTicker } from "@/components/LatestTransfersTicker";

export default function HomePage() {
  const { lang, t } = useLanguage();

  const [featuredClubs, setFeaturedClubs] = useState<ClubAd[]>([]);
  const [featuredPlayers, setFeaturedPlayers] = useState<PlayerProfile[]>([]);
  const [totalClubsCount, setTotalClubsCount] = useState(0);
  const [totalPlayersCount, setTotalPlayersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    targetName: string;
    targetEmail?: string;
    targetId?: string;
    type: "club" | "player";
  }>({
    isOpen: false,
    targetName: "",
    type: "club",
  });

  // Fetch real data from Supabase
  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);

        // 1. Fetch Club Opportunities
        const { data: clubData, error: clubError } = await supabase
          .from("club_ads")
          .select("*")
          .order("created_at", { ascending: false });

        if (!clubError && clubData) {
          const transformedClubs = (clubData as SupabaseClubAdRow[]).map(transformSupabaseClubAd);
          setFeaturedClubs(transformedClubs.slice(0, 3));
          setTotalClubsCount(transformedClubs.length);
        }

        // 2. Fetch Players
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("*")
          .order("created_at", { ascending: false });

        if (!playerError && playerData) {
          const transformedPlayers = (playerData as SupabasePlayerRow[]).map(transformSupabasePlayer);
          setFeaturedPlayers(transformedPlayers.slice(0, 3));
          setTotalPlayersCount(transformedPlayers.length);
        }
      } catch (err) {
        console.error("Failed to load homepage data from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const openContact = (
    targetName: string,
    type: "club" | "player" = "club",
    targetEmail?: string,
    targetId?: string
  ) => {
    setContactModal({
      isOpen: true,
      targetName,
      targetEmail,
      targetId,
      type,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-slate-50">
      <Header onOpenContact={openContact} />

      <main className="flex-1">
        {/* 1. HERO SECTION WITH ATMOSPHERIC BANDY BACKDROP */}
        <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-white py-20 sm:py-28 lg:py-32">
          {/* High-quality winter ice arena / floodlights background */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1515703407324-5f753afd8be8?q=80&w=2000&auto=format&fit=crop"
              alt="Bandy Winter Ice Arena with Stadium Floodlights"
              className="w-full h-full object-cover object-center opacity-45 scale-105"
            />
            {/* Elegant dark overlay */}
            <div className="absolute inset-0 bg-slate-950/70 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-900/50 backdrop-blur-[0.5px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm shadow-sm">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>Global Bandy Network</span>
              </div>

              {/* High Contrast Heading */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-sm">
                The global marketplace & database for{" "}
                <span className="text-sky-300 underline decoration-sky-400/50 underline-offset-8">
                  bandy transfers
                </span>
                .
              </h1>

              {/* Ingress / Subtitle */}
              <p className="mt-6 text-base sm:text-xl text-slate-200 leading-relaxed max-w-2xl font-normal drop-shadow-xs">
                Connect verified bandy players, coaches, and clubs internationally. Discover open roster spots, contract offers, and dual-career solutions with housing and civil employment.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/players"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-base font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Explore Prospects {totalPlayersCount > 0 && `(${totalPlayersCount})`} →
                </Link>
                <Link
                  href="/post-ad"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-base font-semibold border border-white/80 transition-all shadow-sm cursor-pointer"
                >
                  💼 Post Club Listing
                </Link>
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center px-5 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xs text-sm sm:text-base font-medium transition-all cursor-pointer"
                >
                  ⛸️ Create Player Profile
                </Link>
              </div>

              {/* Live Status Indicator */}
              <div className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Season 2026/27 Live Window</span>
                </div>
                <span className="text-slate-500">•</span>
                <div>
                  <span className="font-bold text-white">{totalPlayersCount}</span> registered prospects
                </div>
                <span className="text-slate-500">•</span>
                <div>
                  <span className="font-bold text-white">{totalClubsCount}</span> active club listings
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1.5. OFFICIAL TRANSFERS LIVE TICKER */}
        <LatestTransfersTicker />

        {/* 2. SECTION 1: LATEST ACTIVE CLUB OPPORTUNITIES */}
        <section id="market" className="py-14 sm:py-20 border-b border-slate-200/80 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-1.5">
                  {t.marketPage.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  {t.marketPage.title}
                </h2>
                <p className="text-base text-slate-600 mt-1 max-w-2xl">{t.marketPage.subtitle}</p>
              </div>

              <Link
                href="/market"
                className="text-sm font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all club opportunities ({totalClubsCount})</span>
                <span>→</span>
              </Link>
            </div>

            {/* Club Cards Grid / Empty State */}
            {loading ? (
              <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-sm text-slate-500 shadow-sm">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Loading club opportunities...</span>
              </div>
            ) : featuredClubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredClubs.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 sm:p-6"
                  >
                    <div>
                      {/* Top Row: Country & Division */}
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span>{ad.countryFlag}</span>
                          <span>
                            {ad.city}, {ad.countryCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {ad.urgent && (
                            <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              {t.marketPage.urgentTag}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                            {ad.divisionName[lang] || ad.divisionName.en}
                          </span>
                        </div>
                      </div>

                      {/* Club Name & Target Position */}
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-slate-950">{ad.club}</h3>
                        <div className="text-sm font-semibold text-slate-800 mt-1">
                          {ad.positions && ad.positions.length > 0
                            ? ad.positions.map((p) => t.positions[p] || p).join(", ")
                            : (ad.positionName[lang] || ad.positionName.en)}
                        </div>
                      </div>

                      {/* Description with upgraded text-base */}
                      <p className="text-base text-slate-600 leading-relaxed mb-4">
                        {ad.description[lang] || ad.description.en}
                      </p>

                      {/* Contract Details */}
                      <div className="mb-4 text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                        <span className="text-slate-500 block text-xs uppercase font-medium tracking-wider mb-0.5">
                          Contract Terms
                        </span>
                        {ad.contractType[lang] || ad.contractType.en}
                      </div>

                      {/* Perks List */}
                      {(ad.perks[lang] || ad.perks.en) && (ad.perks[lang] || ad.perks.en).length > 0 && (
                        <div className="space-y-1.5 mb-6">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {t.marketPage.offeredPackageTitle}
                          </div>
                          <ul className="space-y-1.5">
                            {(ad.perks[lang] || ad.perks.en).map((perk, i) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {t.marketPage.postedLabel}: {ad.postedDate[lang] || ad.postedDate.en}
                        </span>
                      </div>

                      <button
                        onClick={() => openContact(ad.club, "club", ad.contactEmail, ad.id)}
                        className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors text-center cursor-pointer shadow-sm"
                      >
                        {t.marketPage.applyBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-xl p-10 text-center shadow-sm">
                <p className="text-base font-semibold text-slate-800 mb-1">
                  No active club opportunities right now.
                </p>
                <p className="text-sm text-slate-500 mb-5">
                  Clubs can post roster needs and recruitment opportunities directly.
                </p>
                <Link
                  href="/post-ad"
                  className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  + {t.marketPage.postOpportunityBtn}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 3. SECTION 2: FEATURED AVAILABLE PLAYERS */}
        <section id="players" className="py-14 sm:py-20 border-b border-slate-200/80 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-1.5">
                  {t.playersPage.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  {t.playersPage.title}
                </h2>
                <p className="text-base text-slate-600 mt-1 max-w-2xl">{t.playersPage.subtitle}</p>
              </div>

              <Link
                href="/players"
                className="text-sm font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Explore all player profiles ({totalPlayersCount})</span>
                <span>→</span>
              </Link>
            </div>

            {/* Players Grid / Empty State */}
            {loading ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-12 text-center text-xs text-slate-500 shadow-sm">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Loading prospects...</span>
              </div>
            ) : featuredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 sm:p-6"
                  >
                    <div>
                      {/* Header: Initials, Name & Status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 relative shadow-xs">
                            {player.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{player.avatarInitials}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/players/${player.id}`}
                                className="text-lg font-bold text-slate-950 hover:underline"
                              >
                                {player.name}
                              </Link>
                              {player.verified && (
                                <span title={t.playersPage.verifiedBadge} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold">
                                  <svg className="w-3 h-3 text-sky-600 inline" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{player.countryFlag}</span>
                              <span>
                                {player.countryName[lang] || player.countryName.en} • {player.age} {t.playersPage.ageLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {/* Warm accent tag for status */}
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                            {player.statusLabel[lang] || player.statusLabel.en}
                          </span>
                          {(player.packagePreference || player.packagePreferenceLabel) && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-sky-50 text-sky-700 border border-sky-200">
                              {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang] || player.packagePreferenceLabel?.en}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Position Strip */}
                      <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-sm flex items-center justify-between">
                        <span className="font-bold text-slate-900">{player.positionName[lang] || player.positionName.en}</span>
                        <span className="text-sm font-medium text-slate-500">{player.previousClub}</span>
                      </div>

                      {/* Bio with upgraded text-base */}
                      <p className="text-base text-slate-600 leading-relaxed mb-4 line-clamp-2">
                        {player.bio[lang] || player.bio.en}
                      </p>

                      {/* Skills Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(player.skills[lang] || player.skills.en || []).slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-50 text-slate-700 border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Social Media Links */}
                      <SocialLinks
                        instagramUrl={player.instagramUrl}
                        youtubeUrl={player.youtubeUrl}
                        tiktokUrl={player.tiktokUrl}
                      />
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        href={`/players/${player.id}`}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors text-center cursor-pointer shadow-sm"
                      >
                        {t.playersPage.viewProfileBtn}
                      </Link>
                      <button
                        onClick={() => openContact(player.name, "player", player.email, player.id)}
                        className="py-2.5 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors text-center border border-slate-200 cursor-pointer shadow-xs"
                      >
                        {t.playersPage.contactBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-xl p-10 text-center shadow-sm">
                <p className="text-base font-semibold text-slate-800 mb-1">
                  No player profiles registered yet.
                </p>
                <p className="text-sm text-slate-500 mb-5">
                  Create your free player profile to get discovered by clubs worldwide.
                </p>
                <Link
                  href="/join"
                  className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  + {t.nav.join}
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ ...contactModal, isOpen: false })}
        targetName={contactModal.targetName}
        targetEmail={contactModal.targetEmail}
        targetId={contactModal.targetId}
        type={contactModal.type}
      />
    </div>
  );
}
