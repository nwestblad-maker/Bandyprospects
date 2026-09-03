"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { TargetCountriesPicker } from "@/components/TargetCountriesPicker";
import { CountryMultiSelect } from "@/components/CountryMultiSelect";
import { AvatarUpload } from "@/components/AvatarUpload";
import { GdprConsentCheckbox } from "@/components/GdprConsentCheckbox";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { ContactPrivacySettings } from "@/components/ContactPrivacySettings";
import { BandyTraitsPicker } from "@/components/BandyTraitsPicker";
import { CareerHistoryEditor } from "@/components/CareerHistoryEditor";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { CareerSeason, OccupationPreference, PlayerGrip, PositionCategory } from "@/types";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeaguesForCountry, getLeagueDisplayName } from "@/lib/leagues";

export default function JoinPage() {
  const { lang, t } = useLanguage();
  const formT = t.joinPage;

  // Form State
  const [formData, setFormData] = useState({
    // Section A: Grundfakta & Fysik
    firstName: "",
    lastName: "",
    birthYear: "2003",
    nationality: "se",
    photoUrl: "",
    youthClub: "",
    academyType: "none" as "RIG" | "NIU" | "local" | "none",
    heightCm: "",
    weightKg: "",
    stickGrip: "left" as PlayerGrip,
    currentClub: "",
    league: "se_elitserien_herr",
    customLeague: "",

    // Section B: Position & Spetsegenskaper
    position: "halv" as PositionCategory,
    secondaryPosition: "" as string,
    playerTraits: [] as string[],

    // Section C: Kontrakt & Civil profil
    contractStatus: "free_agent" as "free_agent" | "expiring_26_27" | "under_contract_loan",
    videoUrl: "",
    contractType: "semi_pro",
    targetCountries: ["SE", "NO", "FI"] as string[],
    occupationPreferences: ["studies", "housing"] as OccupationPreference[],
    spokenLanguages: ["sv", "en"] as string[],
    secondaryCitizenships: [] as string[],
    heritageCountry: "",
    openForNationalTeam: true,
    bioHistory: "",
    instagram_url: "",
    youtube_url: "",
    tiktok_url: "",
    email: "",
    phone: "",
    showPhone: true,
    showEmail: true,
    contactPreference: "all" as "all" | "form_only",

    // Section D: Tidigare klubbar & Säsonger
    careerHistory: [] as CareerSeason[],

    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdPlayerId, setCreatedPlayerId] = useState<string | null>(null);

  const handleToggleOccupation = (pref: OccupationPreference) => {
    if (formData.occupationPreferences.includes(pref)) {
      setFormData({
        ...formData,
        occupationPreferences: formData.occupationPreferences.filter((p) => p !== pref),
      });
    } else {
      setFormData({
        ...formData,
        occupationPreferences: [...formData.occupationPreferences, pref],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.consent) {
      setErrorMessage(
        lang === "sv"
          ? "Vänligen bekräfta samtyckesrutan för att publicera din profil."
          : "Please confirm the verification consent checkbox."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const birthYearNum = parseInt(formData.birthYear, 10) || 2000;

      const resolvedLeagueName =
        formData.league === CUSTOM_OTHER_LEAGUE_VALUE
          ? formData.customLeague.trim()
          : getLeagueDisplayName(formData.league, "sv");

      const clubWithLeague = resolvedLeagueName
        ? `${formData.currentClub.trim()} (${resolvedLeagueName})`
        : formData.currentClub.trim();

      const resolvedVideo = formData.videoUrl.trim() || formData.youtube_url.trim() || null;

      const playerPayload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        birth_year: birthYearNum,
        nationality: formData.nationality.toUpperCase(),
        photo_url: formData.photoUrl.trim() || null,
        youth_club: formData.youthClub.trim() || null,
        academy_type: formData.academyType !== "none" ? formData.academyType : null,
        academy_school: null,
        height: formData.heightCm ? Number(formData.heightCm) : null,
        weight: formData.weightKg ? Number(formData.weightKg) : null,
        stick_hand: formData.stickGrip,
        current_club: clubWithLeague,
        position: formData.position,
        secondary_position: formData.secondaryPosition.trim() || null,
        player_traits: formData.playerTraits,
        key_attributes: formData.playerTraits,
        status: formData.contractStatus === "free_agent" ? "available_free_agent" : "seeking_26_27",
        contract_status: formData.contractStatus,
        video_url: resolvedVideo,
        youtube_url: resolvedVideo,
        package_preference: formData.contractType,
        target_countries: formData.targetCountries,
        occupation_preference: formData.occupationPreferences,
        spoken_languages: formData.spokenLanguages,
        secondary_citizenship: formData.secondaryCitizenships,
        heritage_country: formData.heritageCountry.trim() || null,
        open_for_national_team: Boolean(formData.openForNationalTeam),
        bio: formData.bioHistory.trim() || null,
        career_history: formData.careerHistory.length > 0 ? formData.careerHistory : null,
        instagram_url: formData.instagram_url.trim() || null,
        tiktok_url: formData.tiktok_url.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        show_phone: formData.showPhone,
        show_email: formData.showEmail,
        contact_preference: formData.contactPreference,
      };

      const { data, error } = await supabase
        .from("players")
        .insert(playerPayload)
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(error.message || "Failed to save player profile to database.");
      }

      if (data && data[0]?.id) {
        setCreatedPlayerId(data[0].id);
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
              {lang === "sv" ? "Bandyprospects Spelarregistrering" : formT.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {lang === "sv" ? "Skapa din spelarprofil" : formT.title}
            </h1>
            <p className="text-sm text-zinc-600 mt-2 max-w-xl mx-auto">
              {lang === "sv"
                ? "Fyll i dina bandyfakta, spetsegenskaper och tidigare klubbar för att nå scouter, sportchefer och klubbledare."
                : formT.subtitle}
            </p>
          </div>

          {/* Submission Success Confirmation */}
          {isSubmitted ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold border border-emerald-200">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">{formT.successTitle}</h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto mb-8 leading-relaxed">
                {formT.successDesc}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={createdPlayerId ? `/players/${createdPlayerId}` : "/players"}
                  className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors text-center cursor-pointer"
                >
                  {createdPlayerId ? (lang === "sv" ? "Se din nya profil" : "View Your New Profile") : formT.viewDirectoryBtn}
                </Link>
                <Link
                  href="/players"
                  className="w-full sm:w-auto px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-lg border border-zinc-200 transition-colors text-center cursor-pointer"
                >
                  {formT.viewDirectoryBtn}
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error alert if any */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>⚠️ {errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="font-bold text-rose-900 hover:underline cursor-pointer"
                  >
                    Avfärda
                  </button>
                </div>
              )}

              {/* SECTION A: GRUNDFAKTA & FYSIK */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="pb-3 border-b border-zinc-100">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span>A</span>
                    <span>Grundfakta & Fysik</span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-950">Personuppgifter, Moderklubb & Skola</h2>
                  <p className="text-xs text-zinc-500">
                    Bandybakgrund från moderklubb till bandygymnasium samt fysiska mått.
                  </p>
                </div>

                {/* Avatar / Photo Upload */}
                <AvatarUpload
                  currentUrl={formData.photoUrl}
                  onUploadSuccess={(url) => setFormData({ ...formData, photoUrl: url })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.firstName} *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="t.ex. Viktor"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.lastName} *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="t.ex. Eriksson"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.birthYear} *</label>
                    <input
                      type="number"
                      required
                      min="1975"
                      max="2015"
                      value={formData.birthYear}
                      onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                      placeholder="2003"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <CountrySelect
                      label={formT.nationality}
                      required
                      value={formData.nationality}
                      onChange={(code) => {
                        const available = getLeaguesForCountry(code);
                        const newLeague = available[0]?.id || "other_national_league";
                        setFormData({
                          ...formData,
                          nationality: code,
                          league: newLeague,
                          customLeague: "",
                        });
                      }}
                    />
                  </div>
                </div>

                {/* Moderklubb & Bandygymnasium */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-zinc-100">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-zinc-800 mb-1">
                      {lang === "sv" ? "Moderklubb (där du startade spela bandy)" : "Youth Club (where you started playing bandy)"}
                    </label>
                    <input
                      type="text"
                      value={formData.youthClub}
                      onChange={(e) => setFormData({ ...formData, youthClub: e.target.value })}
                      placeholder="t.ex. Vetlanda BK, Brobergs IF, Edsbyns IF, Bollnäs GIF"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 font-medium"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Klubben där du växte upp och lärde dig grunderna i bandy.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-800 mb-1">
                      {lang === "sv" ? "Bandygymnasium / Utbildning" : "Bandy Academy / High School"}
                    </label>
                    <select
                      value={formData.academyType}
                      onChange={(e) => setFormData({ ...formData, academyType: e.target.value as "RIG" | "NIU" | "local" | "none" })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer font-medium"
                    >
                      <option value="none">Inget av dessa</option>
                      <option value="RIG">RIG</option>
                      <option value="NIU">NIU</option>
                      <option value="local">Lokalt gymnasium</option>
                    </select>
                  </div>
                </div>

                {/* Fysik & Fattning */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-zinc-100">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      {lang === "sv" ? "Längd (cm)" : "Height (cm)"}
                    </label>
                    <input
                      type="number"
                      min="140"
                      max="220"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                      placeholder="t.ex. 185"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      {lang === "sv" ? "Vikt (kg)" : "Weight (kg)"}
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="140"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      placeholder="t.ex. 82"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      {lang === "sv" ? "Fattning (Klubbhand) *" : "Stick Grip *"}
                    </label>
                    <select
                      value={formData.stickGrip}
                      onChange={(e) => setFormData({ ...formData, stickGrip: e.target.value as PlayerGrip })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="left">Vänster (L)</option>
                      <option value="right">Höger (R)</option>
                    </select>
                  </div>
                </div>

                {/* Nuvarande klubb & Serie */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-zinc-100">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      {lang === "sv" ? "Nuvarande klubb / Senaste förening *" : "Current / Latest Club *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.currentClub}
                      onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
                      placeholder="t.ex. Sandvikens AIK"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <LeagueSelect
                      countryCode={formData.nationality}
                      value={formData.league}
                      onChange={(l) => setFormData({ ...formData, league: l })}
                      customLeagueName={formData.customLeague}
                      onCustomLeagueNameChange={(c) => setFormData({ ...formData, customLeague: c })}
                      label={lang === "sv" ? "Nuvarande serie / Liganivå" : "Current League / Division"}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: POSITION & SPETSEGENSKAPER */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="pb-3 border-b border-zinc-100">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span>B</span>
                    <span>Position & Spetsegenskaper</span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-950">Roll på isen & Specialiteter</h2>
                  <p className="text-xs text-zinc-500">
                    Definiera din primära roll, flexibilitet och vad du är vassast på.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-800 mb-1">
                      {lang === "sv" ? "Primär position *" : "Primary Position *"}
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as PositionCategory })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-semibold focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="halv">Halv</option>
                      <option value="midfielder">Mittfältare</option>
                      <option value="defender">Försvarare / Back</option>
                      <option value="forward">Anfallare / Forward</option>
                      <option value="goalkeeper">Målvakt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">
                      {lang === "sv" ? "Sekundär position (Valfritt)" : "Secondary Position (Optional)"}
                    </label>
                    <select
                      value={formData.secondaryPosition}
                      onChange={(e) => setFormData({ ...formData, secondaryPosition: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="">Ingen / Spelar endast primär</option>
                      <option value="halv">Halv</option>
                      <option value="midfielder">Mittfältare</option>
                      <option value="defender">Försvarare / Back</option>
                      <option value="forward">Anfallare / Forward</option>
                      <option value="goalkeeper">Målvakt</option>
                    </select>
                  </div>
                </div>

                {/* Spetsegenskaper Multi-Select Tags */}
                <div className="pt-3 border-t border-zinc-100">
                  <label className="block font-semibold text-zinc-900 text-xs mb-2">
                    {lang === "sv" ? "Spetsegenskaper (Klicka för att välja dina främsta styrkor) *" : "Player Traits (Click to select) *"}
                  </label>
                  <BandyTraitsPicker
                    selectedTraits={formData.playerTraits}
                    onChange={(traits) => setFormData({ ...formData, playerTraits: traits })}
                    lang={lang}
                  />
                </div>
              </div>

              {/* SECTION C: KONTRAKT & CIVIL PROFIL */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="pb-3 border-b border-zinc-100">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span>C</span>
                    <span>Kontrakt & Civil profil</span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-950">Kontraktsstatus, Highlights & Förutsättningar</h2>
                  <p className="text-xs text-zinc-500">
                    Gör det tydligt för intresserade klubbar vad din nuvarande avtalssituation och civila önskemål är.
                  </p>
                </div>

                {/* Kontraktsstatus Select */}
                <div>
                  <label className="block font-semibold text-zinc-800 text-xs mb-1">
                    {lang === "sv" ? "Kontraktsstatus *" : "Contract Status *"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "free_agent",
                        title: lang === "sv" ? "Kontraktslös / Söker klubb" : "Free Agent / Seeking Club",
                        desc: lang === "sv" ? "Redo för övergång och dialog direkt" : "Ready for immediate transfer talks",
                        badge: "text-emerald-700",
                      },
                      {
                        id: "expiring_26_27",
                        title: lang === "sv" ? "Utgående kontrakt 2026/27" : "Expiring Contract 2026/27",
                        desc: lang === "sv" ? "Under avtal men sonderar terrängen" : "Under contract, planning ahead",
                        badge: "text-sky-700",
                      },
                      {
                        id: "under_contract_loan",
                        title: lang === "sv" ? "Under kontrakt (Lån/Samarbete)" : "Under Contract (Seeking Loan)",
                        desc: lang === "sv" ? "Söker lån eller dubbel licens" : "Looking for dual registration / loan",
                        badge: "text-amber-700",
                      },
                    ].map((opt) => {
                      const isSelected = formData.contractStatus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, contractStatus: opt.id as any })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs font-semibold"
                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">{opt.title}</span>
                            {isSelected && <span>✓</span>}
                          </div>
                          <p className={`text-[11px] leading-tight ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Video / Highlights URL Field */}
                <div>
                  <label className="block font-semibold text-zinc-800 text-xs mb-1 flex items-center gap-1.5">
                    <span>▶️</span>
                    <span>{lang === "sv" ? "Video / Highlights (YouTube eller Vimeo länk)" : "Video / Highlights (YouTube or Vimeo URL)"}</span>
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... eller https://vimeo.com/..."
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 text-xs font-medium"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Spelarprofiler med video får upp till 4x fler förfrågningar från elitklubbar och scouter.
                  </p>
                </div>

                {/* Contract Type / Package Preference */}
                <div className="pt-3 border-t border-zinc-100">
                  <label className="block font-bold text-zinc-800 text-xs mb-2">
                    {lang === "sv" ? "Önskad avtalsnivå / Ersättningsform:" : "Preferred Agreement Level:"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "semi_pro",
                        title: lang === "sv" ? "Semiprofessionell" : "Semi-Professional",
                        desc: lang === "sv" ? "Spelarersättning + jobb/studier" : "Club salary + civil career/studies",
                      },
                      {
                        id: "full_time",
                        title: lang === "sv" ? "Heltidsproffs" : "Full-Time Pro",
                        desc: lang === "sv" ? "Heltidsavtal och elitfokus" : "Full-time professional salary",
                      },
                      {
                        id: "amateur",
                        title: lang === "sv" ? "Amatör / Utveckling" : "Amateur / Development",
                        desc: lang === "sv" ? "Hjälp med boende & jobbmatchning" : "Placement with housing & job help",
                      },
                    ].map((opt) => {
                      const isSelected = formData.contractType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, contractType: opt.id })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs font-semibold"
                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">{opt.title}</span>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <p className={`text-[11px] leading-tight ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Checkboxes for Occupation Preferences */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <span className="block font-bold text-zinc-800 text-xs">
                    {lang === "sv" ? "Civila önskemål (Kombinera idrott med):" : "Civil preferences (Combine with):"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: "studies", icon: "🎓", label: formT.optStudies },
                      { id: "fulltime_job", icon: "💼", label: formT.optFulltimeJob },
                      { id: "parttime_job", icon: "🕒", label: formT.optParttimeJob },
                      { id: "housing", icon: "🏠", label: formT.optHousing },
                      { id: "sports_only", icon: "🏒", label: formT.optSportsOnly },
                    ].map((item) => (
                      <label
                        key={item.id}
                        onClick={() => handleToggleOccupation(item.id as OccupationPreference)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          formData.occupationPreferences.includes(item.id as OccupationPreference)
                            ? "bg-zinc-900/5 border-zinc-900 text-zinc-950 font-semibold"
                            : "bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.occupationPreferences.includes(item.id as OccupationPreference)}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                        />
                        <span className="flex items-center gap-1.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Geographic Mobility (Target Countries) */}
                <div className="pt-3 border-t border-zinc-100">
                  <label className="block font-bold text-zinc-800 text-xs mb-2">
                    {formT.targetCountriesTitle}
                  </label>
                  <TargetCountriesPicker
                    selectedCodes={formData.targetCountries}
                    onChange={(codes) => setFormData({ ...formData, targetCountries: codes })}
                  />
                </div>

                {/* Spoken Languages */}
                <div className="pt-3 border-t border-zinc-100">
                  <SpokenLanguagesPicker
                    selectedLanguages={formData.spokenLanguages}
                    onChange={(langs) => setFormData({ ...formData, spokenLanguages: langs })}
                    label={formT.spokenLanguagesTitle}
                    subtitle={formT.spokenLanguagesSubtitle}
                  />
                </div>

                {/* Presentation Text */}
                <div className="pt-3 border-t border-zinc-100 text-xs">
                  <label className="block font-semibold text-zinc-700 mb-1">
                    {lang === "sv" ? "Spelarens presentation & Ambitioner" : formT.bioHistory}
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bioHistory}
                    onChange={(e) => setFormData({ ...formData, bioHistory: e.target.value })}
                    placeholder={
                      lang === "sv"
                        ? "Beskriv din spelstil, dina ambitioner och vad du söker hos en ny klubb..."
                        : formT.bioPlaceholder
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                {/* Social Links (Optional) */}
                <div className="pt-3 border-t border-zinc-100">
                  <span className="block font-semibold text-zinc-700 text-xs mb-2">
                    Sociala medier (Valfritt)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">📸 Instagram</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/..."
                        className="w-full p-2 border rounded-lg border-zinc-200 bg-zinc-50 text-xs"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">▶️ YouTube kanal</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/..."
                        className="w-full p-2 border rounded-lg border-zinc-200 bg-zinc-50 text-xs"
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">🎵 TikTok</label>
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@..."
                        className="w-full p-2 border rounded-lg border-zinc-200 bg-zinc-50 text-xs"
                        value={formData.tiktok_url}
                        onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information & Privacy */}
                <div className="pt-4 border-t border-zinc-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">{formT.email} *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="namn@example.com"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">{formT.phone} *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+46 70 123 45 67"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <ContactPrivacySettings
                    showPhone={formData.showPhone}
                    setShowPhone={(val) => setFormData((prev) => ({ ...prev, showPhone: val }))}
                    showEmail={formData.showEmail}
                    setShowEmail={(val) => setFormData((prev) => ({ ...prev, showEmail: val }))}
                    contactPreference={formData.contactPreference}
                    setContactPreference={(val) => setFormData((prev) => ({ ...prev, contactPreference: val }))}
                    entityType="player"
                  />
                </div>
              </div>

              {/* SECTION D: TIDIGARE KLUBBAR & SÄSONGER */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="pb-3 border-b border-zinc-100">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span>D</span>
                    <span>Tidigare klubbar & Säsonger</span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-950">Karriärhistorik</h2>
                  <p className="text-xs text-zinc-500">
                    Lägg till tidigare säsonger och klubbar du representerat. Visas i en tydlig karriärtabell på din profil.
                  </p>
                </div>

                <CareerHistoryEditor
                  careerHistory={formData.careerHistory}
                  onChange={(history) => setFormData({ ...formData, careerHistory: history })}
                  lang={lang}
                />
              </div>

              {/* GDPR Samtycke */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs">
                <GdprConsentCheckbox
                  checked={formData.consent}
                  onChange={(checked) => setFormData({ ...formData, consent: checked })}
                />
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/players"
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Avbryt
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sparar profil...</span>
                    </>
                  ) : (
                    <>
                      <span>Publicera spelarprofil</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
