"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GatedContactCard } from "@/components/GatedContactCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { VideoEmbed } from "@/components/VideoEmbed";
import SocialLinks from "@/components/SocialLinks";
import { useLanguage } from "@/context/LanguageContext";
import { PlayerProfile } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { transformSupabasePlayer, SupabasePlayerRow } from "@/lib/dataMappers";
import { getCountry, getLanguageName, getLanguageFlag } from "@/data/countries";
import { getTraitIcon } from "@/data/attributes";
import { formatWish, formatCareerPeriod } from "@/lib/formatters";

export default function PlayerDetailPage() {
  const { id } = useParams() as { id: string };
  const { lang, t } = useLanguage();

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        setLoading(true);
        setNotFound(false);
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          console.warn("Could not find player with id:", id, error);
          setPlayer(null);
          setNotFound(true);
        } else {
          setPlayer(transformSupabasePlayer(data as SupabasePlayerRow));
        }
      } catch (err) {
        console.error("Error fetching player:", err);
        setPlayer(null);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPlayer();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center text-sm text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Loading player profile...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !player) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-10 max-w-md w-full text-center shadow-sm">
            <div className="text-3xl mb-3">🔍</div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Player not found
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              The player profile does not exist or has been removed.
            </p>
            <Link
              href="/players"
              className="inline-flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              ← {t.playerDetailPage.backToPlayers}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isWorldwide = player.targetCountries?.includes("ALL");
  const targetCountriesList = player.targetCountries?.filter((c) => c !== "ALL") || [];

  // Contract Status styling badge
  const getContractBadge = () => {
    const status = player.contractStatus;
    if (status === "free_agent") {
      return (
        <span className="px-3 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Free Agent / Seeking Club</span>
        </span>
      );
    }
    if (status === "expiring_26_27") {
      return (
        <span className="px-3 py-1 rounded-md bg-sky-50 border border-sky-300 text-sky-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
          <span>⏳</span>
          <span>Expiring Contract 2026/27</span>
        </span>
      );
    }
    if (status === "under_contract_loan") {
      return (
        <span className="px-3 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
          <span>🤝</span>
          <span>Under Contract (Seeking Loan)</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs">
        {player.statusLabel[lang] || player.statusLabel.en}
      </span>
    );
  };

  // Youth club & Academy text
  const youthAndAcademyText = (() => {
    const parts: string[] = [];
    if (player.youthClub && player.youthClub.trim()) {
      parts.push(`Origin / Youth Club: ${player.youthClub.trim()}`);
    }
    if (player.academyType && player.academyType !== "none" && player.academyType !== "Inget av dessa") {
      parts.push(player.academyType);
    }
    return parts.join(" • ");
  })();

  const traits = player.playerTraits && player.playerTraits.length > 0
    ? player.playerTraits
    : (player.skills[lang] || player.skills.en || []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-slate-50">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back breadcrumb */}
          <div className="mb-6">
            <Link
              href="/players"
              className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1 transition-colors cursor-pointer"
            >
              ← {t.playerDetailPage.backToPlayers}
            </Link>
          </div>

          {/* 1. SPORTS-DRIVEN HEADER / HERO CARD */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Avatar & Identity */}
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-xl bg-slate-900 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-sm overflow-hidden shrink-0 border border-slate-200 relative">
                  {player.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{player.avatarInitials}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                      {player.name}
                    </h1>
                    {player.verified && (
                      <span
                        title={t.playerDetailPage.verifiedPlayer}
                        className="text-slate-900 inline-flex items-center"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Position & Grip */}
                  <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-bold text-slate-950 text-sm">
                      {player.positionName[lang] || player.positionName.en}
                    </span>
                    {player.secondaryPositionName && (
                      <span className="text-xs text-slate-500 font-medium">
                        (Secondary: {player.secondaryPositionName[lang] || player.secondaryPositionName.en})
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {player.gripName[lang] || player.gripName.en}
                    </span>
                    <span>•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span>{player.countryFlag}</span>
                      <span>{player.countryName[lang] || player.countryName.en}</span>
                    </span>
                  </div>

                  {/* Badges Bar: Contract Status & Youth Club / Academy */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {getContractBadge()}

                    {youthAndAcademyText && (
                      <span className="px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs">
                        <span>🌱</span>
                        <span>{youthAndAcademyText}</span>
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      Current Club: <strong className="text-slate-900">{player.previousClub}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Direct CTA & Bookmark */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <BookmarkButton
                  playerId={player.id}
                  playerName={player.name}
                  size="lg"
                  showLabel={true}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById("contact-card");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>✉️</span>
                  <span>{t.playerDetailPage.sendInquiryBtn}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. FAST FACTS GRID (QUICK BIO) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Age / Birth Year
              </span>
              <span className="text-sm font-extrabold text-slate-950 block">
                {player.age} yrs
              </span>
              <span className="text-[11px] text-slate-500">
                b. {new Date().getFullYear() - player.age}
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Height & Weight
              </span>
              <span className="text-sm font-extrabold text-slate-950 block">
                {player.heightWeight}
              </span>
              <span className="text-[11px] text-slate-500">Physics</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Shoots (Left/Right)
              </span>
              <span className="text-sm font-extrabold text-slate-950 block">
                {player.gripName[lang] || player.gripName.en}
              </span>
              <span className="text-[11px] text-slate-500">Grip</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Origin / Youth Club
              </span>
              <span className="text-sm font-extrabold text-slate-950 truncate block" title={player.youthClub?.trim() || "Not specified"}>
                {player.youthClub?.trim() || "Not specified"}
              </span>
              <span className="text-[11px] text-slate-500">
                {player.youthClub?.trim() ? "Youth Roots" : "—"}
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Sports Academy / Bandy High School
              </span>
              <span className="text-sm font-extrabold text-slate-950 block truncate" title={player.academyType && player.academyType !== "none" && player.academyType !== "Inget av dessa" ? player.academyType : "None"}>
                {player.academyType && player.academyType !== "none" && player.academyType !== "Inget av dessa" ? player.academyType : "None"}
              </span>
              <span className="text-[11px] text-slate-500 truncate block">
                {player.academyType && player.academyType !== "none" && player.academyType !== "Inget av dessa" ? "Academy Program" : "—"}
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                Nationality
              </span>
              <span className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5 block">
                <span>{player.countryFlag}</span>
                <span>{player.countryName[lang] || player.countryName.en}</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {player.countryCode}
              </span>
            </div>
          </div>

          {/* TWO COLUMNS CONTENT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2/3): Playing Style, Presentation, Career, Video & Civil */}
            <div className="lg:col-span-2 space-y-8">
              {/* SECTION: PLAYING STYLE & CORE ATTRIBUTES */}
              {traits.length > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-base">⚡</span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                      Playing Style & Core Attributes
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {traits.map((trait, idx) => {
                      const icon = getTraitIcon(trait);
                      return (
                        <div
                          key={idx}
                          className="px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                        >
                          <span>{icon}</span>
                          <span>{trait}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: PLAYER STATEMENT & AMBITION */}
              {player.bio[lang] || player.bio.en ? (
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">📝</span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                      Player Statement & Ambition
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                    {player.bio[lang] || player.bio.en}
                  </p>
                </div>
              ) : null}

              {/* SECTION: CAREER HISTORY */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏒</span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                      Career History & Previous Clubs
                    </h2>
                  </div>
                  {player.youthClub && (
                    <span className="text-xs text-slate-500 font-medium">
                      Origin / Youth Club: <strong className="text-slate-800">{player.youthClub}</strong>
                    </span>
                  )}
                </div>

                {player.careerHistory && player.careerHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <th className="py-2.5 px-3">Period / Seasons</th>
                          <th className="py-2.5 px-3">Club / Team</th>
                          <th className="py-2.5 px-3">Level / League</th>
                          <th className="py-2.5 px-3">Role / Notes (Optional)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {player.careerHistory.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-950 whitespace-nowrap">
                              {formatCareerPeriod(item, lang)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {item.club}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                                {item.league}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 italic">
                              {item.note || item.role || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center">
                    <p className="text-xs text-slate-500">
                      No career history provided yet.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION: RESPONSIVE VIDEO EMBED */}
              {(player.videoUrl || player.youtubeUrl) && (
                <VideoEmbed
                  url={player.videoUrl || player.youtubeUrl}
                  title={`${player.name} - Highlights`}
                  lang={lang}
                />
              )}

              {/* SECTION: CIVIL SETUP */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">💼</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                    {t.playerDetailPage.civilSetupTitle}
                  </h2>
                </div>

                {player.occupationPreferences && player.occupationPreferences.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {player.occupationPreferences.map((pref) => {
                      const label = t.occupationPreferences[pref] || pref;
                      return (
                        <div
                          key={pref}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-2"
                        >
                          <span className="text-emerald-600 font-bold text-sm">✓</span>
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    {t.occupationPreferences.all}
                  </p>
                )}
              </div>

              {/* SECTION: TARGET COUNTRIES / MOBILITY */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🌍</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                    {t.playerDetailPage.targetCountriesTitle}
                  </h2>
                </div>

                {isWorldwide ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-semibold mb-3">
                    {t.playerDetailPage.openWorldwideBadge}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  {targetCountriesList.length > 0 ? (
                    targetCountriesList.map((code) => {
                      const c = getCountry(code);
                      return (
                        <div
                          key={code}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold flex items-center gap-2"
                        >
                          <span className="text-base">{c?.flag || "🏳️"}</span>
                          <span>{c ? (c.names[lang] || c.names.en) : code}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500">
                      {player.countryFlag} {player.countryName[lang] || player.countryName.en}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: LANGUAGES & SOCIAL MEDIA */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">🗣️</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                    Languages & Social Media
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {player.spokenLanguages && player.spokenLanguages.length > 0 ? (
                    player.spokenLanguages.map((code) => (
                      <div
                        key={code}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold flex items-center gap-2"
                      >
                        <span>{getLanguageFlag(code)}</span>
                        <span>{getLanguageName(code, lang)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Swedish, English</span>
                  )}
                </div>

                <SocialLinks
                  instagramUrl={player.instagramUrl}
                  youtubeUrl={player.youtubeUrl}
                  tiktokUrl={player.tiktokUrl}
                />
              </div>
            </div>

            {/* Right Column (1/3): Quick Overview & Gated Contact Card */}
            <div className="space-y-6">
              {/* Quick Specs Card */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-4 pb-3 border-b border-slate-100">
                  {t.playerDetailPage.overviewTitle}
                </h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Position:</dt>
                    <dd className="font-semibold text-slate-900">{player.positionName[lang] || player.positionName.en}</dd>
                  </div>
                  {player.secondaryPositionName && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Secondary Position:</dt>
                      <dd className="font-semibold text-slate-900">{player.secondaryPositionName[lang] || player.secondaryPositionName.en}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Shoots (Left/Right):</dt>
                    <dd className="font-semibold text-slate-900">{player.gripName[lang] || player.gripName.en}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Measurements:</dt>
                    <dd className="font-semibold text-slate-900">{player.heightWeight}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Origin / Youth Club:</dt>
                    <dd className="font-semibold text-slate-900">{player.youthClub?.trim() || "Not specified"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Sports Academy / Bandy High School:</dt>
                    <dd className="font-semibold text-slate-900">
                      {player.academyType && player.academyType !== "none" && player.academyType !== "Inget av dessa"
                        ? player.academyType
                        : "None"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Current Club:</dt>
                    <dd className="font-semibold text-slate-900 truncate max-w-[150px]" title={player.previousClub}>
                      {player.previousClub}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Current Status:</dt>
                    <dd className="font-semibold text-slate-900">
                      {player.contractStatusLabel?.[lang] || player.contractStatusLabel?.en || player.statusLabel[lang] || player.statusLabel.en}
                    </dd>
                  </div>
                  {(player.packagePreference || player.packagePreferenceLabel) && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Package Wish:</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang] || player.packagePreferenceLabel?.en}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Gated Direct Contact Information Card */}
              <div id="contact-card" className="scroll-mt-24">
                <GatedContactCard
                  contactName={player.name}
                  contactEmail={player.email}
                  contactPhone={player.phone}
                  contactRole="Player"
                  showPhone={player.showPhone}
                  showEmail={player.showEmail}
                  contactPreference={player.contactPreference}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
