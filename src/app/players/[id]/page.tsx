"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModal } from "@/components/ContactModal";
import { GatedContactCard } from "@/components/GatedContactCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useLanguage } from "@/context/LanguageContext";
import { PlayerProfile } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { transformSupabasePlayer, SupabasePlayerRow } from "@/lib/dataMappers";
import { getCountry, getLanguageName, getLanguageFlag } from "@/data/countries";
import { formatWish } from "@/lib/formatters";

export default function PlayerDetailPage() {
  const { id } = useParams() as { id: string };
  const { lang, t } = useLanguage();

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    targetName: string;
    targetEmail?: string;
    targetId?: string;
    type: "club" | "player";
  }>({
    isOpen: false,
    targetName: "",
    type: "player",
  });

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

  const openContact = (targetName: string) => {
    setContactModal({
      isOpen: true,
      targetName,
      targetEmail: player?.email,
      targetId: player?.id,
      type: "player",
    });
  };

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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header onOpenContact={openContact} />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back breadcrumb */}
          <div className="mb-6">
            <Link
              href="/players"
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {t.playerDetailPage.backToPlayers}
            </Link>
          </div>

          {/* Profile Main Header Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 mb-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Avatar & Identity */}
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-zinc-200 relative">
                  {player.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{player.avatarInitials}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
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

                  <div className="text-xs sm:text-sm text-zinc-600 flex items-center gap-2 mt-1">
                    <span>{player.countryFlag}</span>
                    <span>
                      {player.countryName[lang]} • {player.age} {t.playersPage.ageLabel}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-zinc-900">
                      {player.positionName[lang]} ({player.gripName[lang]})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold">
                      {player.statusLabel[lang]}
                    </span>
                    {player.packagePreferenceLabel && (
                      <span className="px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
                        {player.packagePreferenceLabel[lang]}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      {t.playerDetailPage.previousClub}: {player.previousClub}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Direct CTA & Bookmark */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <BookmarkButton
                  playerId={player.id}
                  playerName={player.name}
                  size="lg"
                  showLabel={true}
                />
                <button
                  onClick={() => openContact(player.name)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors text-center cursor-pointer"
                >
                  {t.playerDetailPage.sendInquiryBtn}
                </button>
              </div>
            </div>
          </div>

          {/* Two Columns Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2/3): Scouting Report, Attributes, Preferences & History */}
            <div className="lg:col-span-2 space-y-8">
              {/* Section: Scouting Report & Bio */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-3">
                  {t.playerDetailPage.bioTitle}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                  {player.bio[lang]}
                </p>
              </div>

              {/* Section: Key Attributes & Strengths (Shown only if player selected attributes) */}
              {player.skills[lang] && player.skills[lang].length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-4">
                    {t.playerDetailPage.keySkillsTitle}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {player.skills[lang].map((skill, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-2 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Geographic Mobility & Target Destination Countries */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-3">
                  {t.playerDetailPage.targetCountriesTitle}
                </h2>

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
                          className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-2"
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

              {/* Section: National Team & FIB Eligibility (Heritage & Passports) */}
              {(player.openForNationalTeam || (player.secondaryCitizenships && player.secondaryCitizenships.length > 0) || player.heritageCountry) && (
                <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                      <span>🌍</span>
                      <span>{lang === "sv" ? "Landslag & Internationell behörighet" : "National Team & International Eligibility"}</span>
                    </h2>
                    {player.openForNationalTeam && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 text-[11px] font-bold">
                        ✓ {lang === "sv" ? "Öppen för landslag" : "Open for National Team"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    {player.secondaryCitizenships && player.secondaryCitizenships.length > 0 && (
                      <div>
                        <span className="font-semibold text-zinc-500 block mb-1.5 uppercase text-[10px] tracking-wider">
                          {lang === "sv" ? "Medborgarskap / Pass" : "Citizenships / Passports"}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {player.secondaryCitizenships.map((code) => {
                            const c = getCountry(code);
                            return (
                              <div
                                key={code}
                                className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-2"
                              >
                                <span className="text-base">{c?.flag || "🛂"}</span>
                                <span>{c ? c.names[lang] : code}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {player.heritageCountry && (
                      <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                        <span className="font-bold text-zinc-900 block text-[11px] uppercase tracking-wider mb-1">
                          🧬 {lang === "sv" ? "Landslagsanknytning & Rötter (Heritage)" : "Family Heritage & Ancestry"}:
                        </span>
                        <p className="text-zinc-800 font-medium">{player.heritageCountry}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section: Civil Profile & Dual-Career Setup */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-3">
                  {t.playerDetailPage.civilSetupTitle}
                </h2>

                {player.occupationPreferences && player.occupationPreferences.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {player.occupationPreferences.map((pref) => {
                      const label = t.occupationPreferences[pref] || pref;
                      return (
                        <div
                          key={pref}
                          className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-2"
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

              {/* Section: Spoken Languages & Integration */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-3">
                  {t.playerDetailPage.spokenLanguagesTitle}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {player.spokenLanguages && player.spokenLanguages.length > 0 ? (
                    player.spokenLanguages.map((code) => (
                      <div
                        key={code}
                        className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold flex items-center gap-2"
                      >
                        <span>{getLanguageFlag(code)}</span>
                        <span>{getLanguageName(code, lang)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500">Svenska, Engelska</span>
                  )}
                </div>
              </div>

              {/* Section: Transfer Preferences */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 mb-3">
                  {t.playerDetailPage.transferPreferencesTitle}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                  {player.seekingPreferences[lang]}
                </p>
              </div>

              {/* Section: Video Highlights & Social Media */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                  {lang === "sv" ? "Highlights & Sociala Medier" : "Highlights & Social Media"}
                </h2>

                {player.youtubeUrl ? (
                  <a
                    href={player.youtubeUrl.startsWith("http") ? player.youtubeUrl : `https://${player.youtubeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-red-50 hover:bg-red-100/70 border border-red-200 text-xs text-red-950 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        ▶
                      </div>
                      <div>
                        <span className="font-bold text-zinc-950 block text-xs">
                          {lang === "sv" ? "Se matchklipp & Highlights" : "Watch Game Tape & Highlights"}
                        </span>
                        <span className="text-[11px] text-zinc-600 truncate max-w-xs block">
                          {player.youtubeUrl}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-700 group-hover:translate-x-0.5 transition-transform">
                      {lang === "sv" ? "Öppna" : "Watch"} ↗
                    </span>
                  </a>
                ) : (
                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-600 font-bold">
                      ▶
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900 block">Game Tape & Clips</span>
                      <span>{t.playerDetailPage.videoPlaceholderText}</span>
                    </div>
                  </div>
                )}

                {/* Social media links if present */}
                {(player.instagramUrl || player.tiktokUrl) && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-zinc-100">
                    {player.instagramUrl && (
                      <a
                        href={player.instagramUrl.startsWith("http") ? player.instagramUrl : `https://${player.instagramUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200 text-xs font-semibold transition-colors"
                      >
                        <span>📸</span>
                        <span>Instagram</span>
                        <span>↗</span>
                      </a>
                    )}
                    {player.tiktokUrl && (
                      <a
                        href={player.tiktokUrl.startsWith("http") ? player.tiktokUrl : `https://${player.tiktokUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold transition-colors"
                      >
                        <span>🎵</span>
                        <span>TikTok</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (1/3): Quick Specs & Direct Inquiry */}
            <div className="space-y-6">
              {/* Quick Specs Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-4 pb-3 border-b border-zinc-100">
                  {t.playerDetailPage.overviewTitle}
                </h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">{t.playerDetailPage.nationality}:</dt>
                    <dd className="font-semibold text-zinc-900">
                      {player.countryFlag} {player.countryName[lang]}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">{t.playerDetailPage.stickGrip}:</dt>
                    <dd className="font-semibold text-zinc-900">{player.gripName[lang]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">{t.playerDetailPage.heightWeight}:</dt>
                    <dd className="font-semibold text-zinc-900">{player.heightWeight}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">{t.playerDetailPage.previousClub}:</dt>
                    <dd className="font-semibold text-zinc-900">{player.previousClub}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">{t.playerDetailPage.contractStatus}:</dt>
                    <dd className="font-semibold text-zinc-900">{player.statusLabel[lang]}</dd>
                  </div>
                  {(player.packagePreference || player.packagePreferenceLabel) && (
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">{lang === "sv" ? "Avtalsnivå:" : "Contract Level:"}</dt>
                      <dd className="font-semibold text-zinc-900">
                        {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang]}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Gated Direct Contact Information Card */}
              <GatedContactCard
                contactName={player.name}
                contactEmail={player.email}
                contactPhone={player.phone}
                contactRole={lang === "sv" ? "Spelare" : "Player"}
              />

              {/* Inquiry CTA Card */}
              <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-xs">
                <h3 className="text-sm font-bold mb-1">{t.playerDetailPage.contactScoutTitle}</h3>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                  {t.playerDetailPage.contactScoutSubtitle}
                </p>
                <button
                  onClick={() => openContact(player.name)}
                  className="w-full py-2.5 px-4 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs transition-colors text-center cursor-pointer"
                >
                  {t.playerDetailPage.sendInquiryBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
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
