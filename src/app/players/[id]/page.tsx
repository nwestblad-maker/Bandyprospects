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
import { formatWish } from "@/lib/formatters";

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
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center text-xs text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Laddar spelarprofil...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !player) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-10 max-w-md w-full text-center shadow-xs">
            <div className="text-3xl mb-3">🔍</div>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">
              {lang === "sv" ? "Spelaren kunde inte hittas" : "Player not found"}
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              {lang === "sv"
                ? "Profilen finns inte eller har tagits bort."
                : "The player profile does not exist or has been removed."}
            </p>
            <Link
              href="/players"
              className="inline-flex items-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors"
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
        <span className="px-3 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{lang === "sv" ? "Kontraktslös / Söker klubb" : "Free Agent / Seeking Club"}</span>
        </span>
      );
    }
    if (status === "expiring_26_27") {
      return (
        <span className="px-3 py-1 rounded-md bg-sky-50 border border-sky-300 text-sky-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
          <span>⏳</span>
          <span>{lang === "sv" ? "Utgående kontrakt 2026/27" : "Expiring Contract 2026/27"}</span>
        </span>
      );
    }
    if (status === "under_contract_loan") {
      return (
        <span className="px-3 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
          <span>🤝</span>
          <span>{lang === "sv" ? "Under kontrakt (Söker lån/samarbete)" : "Under Contract (Seeking Loan)"}</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold shadow-2xs">
        {player.statusLabel[lang]}
      </span>
    );
  };

  // Youth club & Academy text
  const youthAndAcademyText = (() => {
    const parts: string[] = [];
    if (player.youthClub) {
      parts.push(`Moderklubb: ${player.youthClub}`);
    }
    if (player.academyType && player.academyType !== "none") {
      const schoolPart = player.academySchool ? ` (${player.academySchool})` : "";
      parts.push(`${player.academyType}${schoolPart}`);
    }
    return parts.join(" • ");
  })();

  const traits = player.playerTraits && player.playerTraits.length > 0
    ? player.playerTraits
    : (player.skills[lang] || []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back breadcrumb */}
          <div className="mb-6">
            <Link
              href="/players"
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors cursor-pointer"
            >
              ← {t.playerDetailPage.backToPlayers}
            </Link>
          </div>

          {/* 1. SPORTS-DRIVEN HEADER / HERO CARD */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Avatar & Identity */}
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-zinc-900 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-zinc-200 relative">
                  {player.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{player.avatarInitials}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                      {player.name}
                    </h1>
                    {player.verified && (
                      <span
                        title={t.playerDetailPage.verifiedPlayer}
                        className="text-zinc-900 inline-flex items-center"
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
                  <div className="text-xs sm:text-sm text-zinc-600 flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-bold text-zinc-950 text-sm">
                      {player.positionName[lang]}
                    </span>
                    {player.secondaryPositionName && (
                      <span className="text-xs text-zinc-500 font-medium">
                        (Sekundär: {player.secondaryPositionName[lang]})
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-xs font-semibold text-zinc-700">
                      {player.gripName[lang]}
                    </span>
                    <span>•</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <span>{player.countryFlag}</span>
                      <span>{player.countryName[lang]}</span>
                    </span>
                  </div>

                  {/* Badges Bar: Contract Status & Youth Club / Academy */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {getContractBadge()}

                    {youthAndAcademyText && (
                      <span className="px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
                        <span>🌱</span>
                        <span>{youthAndAcademyText}</span>
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs font-medium">
                      Nuvarande: <strong className="text-zinc-900">{player.previousClub}</strong>
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
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>✉️</span>
                  <span>{t.playerDetailPage.sendInquiryBtn}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. FAST FACTS GRID (QUICK BIO) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider mb-1">
                Födelseår / Ålder
              </span>
              <span className="text-sm font-extrabold text-zinc-950 block">
                {player.age} {t.playersPage.ageLabel}
              </span>
              <span className="text-[11px] text-zinc-500">
                f. {new Date().getFullYear() - player.age}
              </span>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider mb-1">
                Längd & Vikt
              </span>
              <span className="text-sm font-extrabold text-zinc-950 block">
                {player.heightWeight}
              </span>
              <span className="text-[11px] text-zinc-500">Fysik</span>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider mb-1">
                Fattning
              </span>
              <span className="text-sm font-extrabold text-zinc-950 block">
                {player.gripName[lang]}
              </span>
              <span className="text-[11px] text-zinc-500">Klubbhand</span>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider mb-1">
                Moderklubb
              </span>
              <span className="text-sm font-extrabold text-zinc-950 truncate block" title={player.youthClub || "Ej angiven"}>
                {player.youthClub || "Ej angiven"}
              </span>
              <span className="text-[11px] text-zinc-500">Bandybakgrund</span>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider mb-1">
                Utbildning
              </span>
              <span className="text-sm font-extrabold text-zinc-950 block truncate" title={player.academyType !== "none" && player.academyType ? `${player.academyType} ${player.academySchool || ""}` : "Lokalt gymnasium"}>
                {player.academyType && player.academyType !== "none" ? player.academyType : "Inget / Lokalt"}
              </span>
              <span className="text-[11px] text-zinc-500 truncate block">
                {player.academySchool || "Bandygymnasium"}
              </span>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider mb-1">
                Nationalitet
              </span>
              <span className="text-sm font-extrabold text-zinc-950 flex items-center gap-1.5 block">
                <span>{player.countryFlag}</span>
                <span>{player.countryName[lang]}</span>
              </span>
              <span className="text-[11px] text-zinc-500">
                {player.countryCode}
              </span>
            </div>
          </div>

          {/* TWO COLUMNS CONTENT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2/3): Spelstil, Presentation, Karriärtabell, Video & Civilt */}
            <div className="lg:col-span-2 space-y-8">
              {/* SECTION: SPELSTIL & SPETSEGENSKAPER */}
              {traits.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-base">⚡</span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                      Spelstil & Spetsegenskaper
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {traits.map((trait, idx) => {
                      const icon = getTraitIcon(trait);
                      return (
                        <div
                          key={idx}
                          className="px-3.5 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                        >
                          <span>{icon}</span>
                          <span>{trait}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: SPELARENS PRESENTATION */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📝</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    Spelarens presentation & Ambition
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-line font-normal">
                  {player.bio[lang]}
                </p>
              </div>

              {/* SECTION: KARRIÄRTABELL (SÄSONGER & KLUBBAR) */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏒</span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                      Karriärhistorik & Tidigare klubbar
                    </h2>
                  </div>
                  {player.youthClub && (
                    <span className="text-xs text-zinc-500 font-medium">
                      Startade i: <strong className="text-zinc-800">{player.youthClub}</strong>
                    </span>
                  )}
                </div>

                {player.careerHistory && player.careerHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          <th className="py-2.5 px-3">Säsong</th>
                          <th className="py-2.5 px-3">Klubb</th>
                          <th className="py-2.5 px-3">Serie / Nivå</th>
                          <th className="py-2.5 px-3">Roll / Notering</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {player.careerHistory.map((item, i) => (
                          <tr key={i} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-zinc-950 whitespace-nowrap">
                              {item.season}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">
                              {item.club}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200">
                                {item.league}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600 italic">
                              {item.role || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-900 block mb-0.5">Senaste klubb:</span>
                    <span>{player.previousClub}</span>
                    {player.youthClub && (
                      <span className="block text-zinc-500 mt-1">
                        Moderklubb: {player.youthClub}
                      </span>
                    )}
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

              {/* SECTION: CIVILA FÖRUTSÄTTNINGAR & INTEGRATION */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">💼</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
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
                          className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-2"
                        >
                          <span className="text-emerald-600 font-bold text-sm">✓</span>
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    {t.occupationPreferences.all}
                  </p>
                )}
              </div>

              {/* SECTION: GEOGRAFISK MOBILITET */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🌍</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    {t.playerDetailPage.targetCountriesTitle}
                  </h2>
                </div>

                {isWorldwide ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold mb-3">
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
                          className="px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-2"
                        >
                          <span className="text-base">{c?.flag || "🏳️"}</span>
                          <span>{c ? c.names[lang] : code}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-zinc-500">
                      {player.countryFlag} {player.countryName[lang]}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: SPRÅK & SOCIALA MEDIER */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">🗣️</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    Språk & Sociala medier
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {player.spokenLanguages && player.spokenLanguages.length > 0 ? (
                    player.spokenLanguages.map((code) => (
                      <div
                        key={code}
                        className="px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-2"
                      >
                        <span>{getLanguageFlag(code)}</span>
                        <span>{getLanguageName(code, lang)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500">Svenska, Engelska</span>
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
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-3 border-b border-zinc-100">
                  {t.playerDetailPage.overviewTitle}
                </h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Position:</dt>
                    <dd className="font-semibold text-zinc-900">{player.positionName[lang]}</dd>
                  </div>
                  {player.secondaryPositionName && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Sekundär:</dt>
                      <dd className="font-semibold text-zinc-900">{player.secondaryPositionName[lang]}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Fattning:</dt>
                    <dd className="font-semibold text-zinc-900">{player.gripName[lang]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Mått:</dt>
                    <dd className="font-semibold text-zinc-900">{player.heightWeight}</dd>
                  </div>
                  {player.youthClub && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Moderklubb:</dt>
                      <dd className="font-semibold text-zinc-900">{player.youthClub}</dd>
                    </div>
                  )}
                  {player.academyType && player.academyType !== "none" && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Gymnasium:</dt>
                      <dd className="font-semibold text-zinc-900">
                        {player.academyType} {player.academySchool ? `(${player.academySchool})` : ""}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Nuvarande:</dt>
                    <dd className="font-semibold text-zinc-900 truncate max-w-[150px]" title={player.previousClub}>
                      {player.previousClub}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Kontrakt:</dt>
                    <dd className="font-semibold text-zinc-900">
                      {player.contractStatusLabel?.[lang] || player.statusLabel[lang]}
                    </dd>
                  </div>
                  {(player.packagePreference || player.packagePreferenceLabel) && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Avtalsnivå:</dt>
                      <dd className="font-semibold text-zinc-900">
                        {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang]}
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
                  contactRole={lang === "sv" ? "Spelare" : "Player"}
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
