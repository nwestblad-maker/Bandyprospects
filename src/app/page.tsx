"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModal } from "@/components/ContactModal";
import { useLanguage } from "@/context/LanguageContext";
import { getCountry, getLanguageName } from "@/data/countries";
import { ClubAd, PlayerProfile, PositionCategory } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { transformSupabasePlayer, transformSupabaseClubAd, SupabasePlayerRow, SupabaseClubAdRow } from "@/lib/dataMappers";
import SocialLinks from "@/components/SocialLinks";
import { formatWish } from "@/lib/formatters";
import { LatestTransfersTicker } from "@/components/LatestTransfersTicker";
import { BandyNetworkStats } from "@/components/BandyNetworkStats";

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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header onOpenContact={openContact} />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="pt-12 pb-14 sm:pt-16 sm:pb-20 border-b border-zinc-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                <span>Global Bandy Network</span>
              </div>

              {/* Minimalist Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-950 tracking-tight leading-[1.15]">
                {lang === "en" && (
                  <>
                    The global marketplace & database for{" "}
                    <span className="text-zinc-600 underline decoration-zinc-300 underline-offset-4">
                      bandy transfers
                    </span>
                    .
                  </>
                )}
                {lang === "sv" && (
                  <>
                    Den globala marknadsplatsen & databasen för{" "}
                    <span className="text-zinc-600 underline decoration-zinc-300 underline-offset-4">
                      bandyövergångar
                    </span>
                    .
                  </>
                )}
                {lang === "fi" && (
                  <>
                    Jääpallon maailmanlaajuinen markkinapaikka ja{" "}
                    <span className="text-zinc-600 underline decoration-zinc-300 underline-offset-4">
                      siirtotietokanta
                    </span>
                    .
                  </>
                )}
                {lang === "no" && (
                  <>
                    Den globale markedsplassen og databasen for{" "}
                    <span className="text-zinc-600 underline decoration-zinc-300 underline-offset-4">
                      bandyoverganger
                    </span>
                    .
                  </>
                )}
              </h1>

              {/* Ingress / Subtitle */}
              <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl">
                {lang === "en" &&
                  "Connect verified bandy players, coaches, and clubs internationally. Discover open roster spots, contract offers, and dual-career solutions with housing and civil employment."}
                {lang === "sv" &&
                  "Koppla ihop verifierade bandyspelare, tränare och klubbar internationellt. Hitta öppna trupplatser, kontraktsförslag och helhetslösningar med boende och civilt jobb."}
                {lang === "fi" &&
                  "Yhdistä vahvistetut jääpalloilijat, valmentajat ja seurat kansainvälisesti. Löydä avoimet pelipaikat, sopimustarjoukset sekä helppokäyttöiset asunto- ja työpaketit."}
                {lang === "no" &&
                  "Koble sammen verifiserte bandyspillere, trenere og klubber internasjonalt. Finn åpne plasser, kontraktstilbud og helhetsløsninger med bosted og sivilt arbeid."}
              </p>

              {/* Action Buttons */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/players"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  {t.nav.players} {totalPlayersCount > 0 && `(${totalPlayersCount})`} →
                </Link>
                <Link
                  href="/market"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-900 text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t.nav.market} {totalClubsCount > 0 && `(${totalClubsCount})`}
                </Link>
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-semibold transition-colors cursor-pointer"
                >
                  + {t.nav.join}
                </Link>
              </div>

              {/* Live Status Indicator */}
              <div className="mt-8 flex items-center gap-4 text-xs text-zinc-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Season 2026/27 Live Registration</span>
                </div>
                <span>•</span>
                <div>
                  <span className="font-bold text-zinc-900">{totalPlayersCount}</span> {lang === "sv" ? "spelare" : "players"}
                </div>
                <span>•</span>
                <div>
                  <span className="font-bold text-zinc-900">{totalClubsCount}</span> {lang === "sv" ? "öppna klubbannonser" : "club openings"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1.5. OFFICIAL TRANSFERS LIVE TICKER */}
        <LatestTransfersTicker />

        {/* 1.75. AGGREGATED BANDY STATS BANNER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mb-4">
          <BandyNetworkStats lang={lang} />
        </div>

        {/* 2. SECTION 1: LATEST ACTIVE CLUB OPPORTUNITIES */}
        <section id="market" className="py-14 sm:py-20 border-b border-zinc-200 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="text-xs font-bold tracking-wider uppercase text-zinc-500 mb-1.5">
                  {t.marketPage.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {t.marketPage.title}
                </h2>
                <p className="text-sm text-zinc-600 mt-1 max-w-2xl">{t.marketPage.subtitle}</p>
              </div>

              <Link
                href="/market"
                className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{lang === "sv" ? `Visa alla klubbannonser (${totalClubsCount})` : `View all club opportunities (${totalClubsCount})`}</span>
                <span>→</span>
              </Link>
            </div>

            {/* Club Cards Grid / Empty State */}
            {loading ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-xs text-zinc-500">
                <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Laddar klubbannonser...</span>
              </div>
            ) : featuredClubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredClubs.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex flex-col justify-between bg-white border border-zinc-200 rounded-xl p-6 hover:border-zinc-400 transition-colors shadow-xs"
                  >
                    <div>
                      {/* Top Row: Country & Division */}
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                          <span>{ad.countryFlag}</span>
                          <span>
                            {ad.city}, {ad.countryCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {ad.urgent && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-50 text-rose-700 border border-rose-200">
                              {t.marketPage.urgentTag}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                            {ad.divisionName[lang]}
                          </span>
                        </div>
                      </div>

                      {/* Club Name & Target Position */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-zinc-950">{ad.club}</h3>
                        <div className="text-sm font-semibold text-zinc-800 mt-0.5">
                          {ad.positions && ad.positions.length > 0
                            ? ad.positions.map((p) => t.positions[p] || p).join(", ")
                            : ad.positionName[lang]}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-600 leading-relaxed mb-4">{ad.description[lang]}</p>

                      {/* Contract Details */}
                      <div className="mb-4 text-xs font-medium text-zinc-800 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Contract Terms
                        </span>
                        {ad.contractType[lang]}
                      </div>

                      {/* Perks List */}
                      {ad.perks[lang] && ad.perks[lang].length > 0 && (
                        <div className="space-y-1.5 mb-6">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            {t.marketPage.offeredPackageTitle}
                          </div>
                          <ul className="space-y-1">
                            {ad.perks[lang].map((perk, i) => (
                              <li key={i} className="text-xs text-zinc-700 flex items-start gap-2">
                                <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>
                          {t.marketPage.postedLabel}: {ad.postedDate[lang]}
                        </span>
                      </div>

                      <button
                        onClick={() => openContact(ad.club, "club", ad.contactEmail, ad.id)}
                        className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors text-center cursor-pointer"
                      >
                        {t.marketPage.applyBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
                <p className="text-sm font-semibold text-zinc-800 mb-1">
                  {lang === "sv"
                    ? "Inga aktiva klubbefterlysningar just nu."
                    : "No active club opportunities right now."}
                </p>
                <p className="text-xs text-zinc-500 mb-5">
                  {lang === "sv"
                    ? "Föreningar kan registrera och publicera truppbehov direkt på marknadsplatsen."
                    : "Clubs can post roster needs and recruitment opportunities directly."}
                </p>
                <Link
                  href="/post-ad"
                  className="inline-flex items-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  + {t.marketPage.postOpportunityBtn}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 3. SECTION 2: FEATURED AVAILABLE PLAYERS */}
        <section id="players" className="py-14 sm:py-20 border-b border-zinc-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="text-xs font-bold tracking-wider uppercase text-zinc-500 mb-1.5">
                  {t.playersPage.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                  {t.playersPage.title}
                </h2>
                <p className="text-sm text-zinc-600 mt-1 max-w-2xl">{t.playersPage.subtitle}</p>
              </div>

              <Link
                href="/players"
                className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{lang === "sv" ? `Utforska alla spelarprofiler (${totalPlayersCount})` : `Explore all player profiles (${totalPlayersCount})`}</span>
                <span>→</span>
              </Link>
            </div>

            {/* Players Grid / Empty State */}
            {loading ? (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-12 text-center text-xs text-zinc-500">
                <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Laddar spelare...</span>
              </div>
            ) : featuredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col justify-between bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-zinc-400 transition-colors shadow-xs"
                  >
                    <div>
                      {/* Header: Initials, Name & Status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 relative">
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
                                className="text-base font-bold text-zinc-950 hover:underline"
                              >
                                {player.name}
                              </Link>
                              {player.verified && (
                                <span title={t.playersPage.verifiedBadge} className="text-zinc-900">
                                  <svg className="w-3.5 h-3.5 inline" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              <span>{player.countryFlag}</span>
                              <span>
                                {player.countryName[lang]} • {player.age} {t.playersPage.ageLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-200 text-zinc-800">
                            {player.statusLabel[lang]}
                          </span>
                          {(player.packagePreference || player.packagePreferenceLabel) && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">
                              {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Position Strip */}
                      <div className="mb-3 p-2 bg-white rounded-lg border border-zinc-200 text-xs flex items-center justify-between">
                        <span className="font-bold text-zinc-900">{player.positionName[lang]}</span>
                        <span className="text-zinc-500">{player.previousClub}</span>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-zinc-600 leading-relaxed mb-4 line-clamp-2">
                        {player.bio[lang]}
                      </p>

                      {/* Skills Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {player.skills[lang].slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-medium rounded bg-white text-zinc-700 border border-zinc-200"
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
                    <div className="pt-4 border-t border-zinc-200 flex items-center gap-2">
                      <Link
                        href={`/players/${player.id}`}
                        className="flex-1 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors text-center cursor-pointer"
                      >
                        {t.playersPage.viewProfileBtn}
                      </Link>
                      <button
                        onClick={() => openContact(player.name, "player", player.email, player.id)}
                        className="py-2 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 font-semibold text-xs transition-colors text-center border border-zinc-200 cursor-pointer"
                      >
                        {t.playersPage.contactBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-10 text-center">
                <p className="text-sm font-semibold text-zinc-800 mb-1">
                  {lang === "sv"
                    ? "Inga spelarprofiler registrerade ännu."
                    : "No player profiles registered yet."}
                </p>
                <p className="text-xs text-zinc-500 mb-5">
                  {lang === "sv"
                    ? "Skapa din spelarprofil gratis för att upptäckas av klubbar internationellt."
                    : "Create your free player profile to get discovered by clubs worldwide."}
                </p>
                <Link
                  href="/join"
                  className="inline-flex items-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors"
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
