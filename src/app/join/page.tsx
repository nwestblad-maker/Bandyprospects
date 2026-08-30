"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { KeyAttributesPicker } from "@/components/KeyAttributesPicker";
import { TargetCountriesPicker } from "@/components/TargetCountriesPicker";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { OccupationPreference } from "@/types";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeaguesForCountry, getLeagueDisplayName } from "@/lib/leagues";

export default function JoinPage() {
  const { lang, t } = useLanguage();
  const formT = t.joinPage;

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthYear: "",
    nationality: "se",
    currentClub: "",
    league: "se_elitserien_herr",
    customLeague: "",
    position: "halv",
    stickGrip: "left",
    heightCm: "",
    weightKg: "",
    keyAttributes: ["skating", "game_sense", "passing"] as string[],
    secondaryCitizenships: [] as string[],
    heritageCountry: "",
    openForNationalTeam: true,
    status: "seeking_26_27",
    targetCountries: ["SE", "NO", "FI"] as string[],
    occupationPreferences: ["studies", "housing"] as OccupationPreference[],
    spokenLanguages: ["sv", "en"] as string[],
    contractType: "semi_pro",
    bioHistory: "",
    videoLink: "",
    email: "",
    phone: "",
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

      const playerPayload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        birth_year: birthYearNum,
        nationality: formData.nationality.toUpperCase(),
        secondary_citizenship: formData.secondaryCitizenships,
        heritage_country: formData.heritageCountry.trim() || null,
        open_for_national_team: Boolean(formData.openForNationalTeam),
        current_club: clubWithLeague,
        position: formData.position,
        stick_hand: formData.stickGrip,
        status: formData.status,
        package_preference: formData.contractType,
        target_countries: formData.targetCountries,
        occupation_preference: formData.occupationPreferences,
        spoken_languages: formData.spokenLanguages,
        key_attributes: formData.keyAttributes,
        bio: formData.bioHistory.trim() || null,
        video_url: formData.videoLink.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
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
              {formT.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {formT.title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-xl mx-auto">
              {formT.subtitle}
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
                  className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors text-center"
                >
                  {createdPlayerId ? (lang === "sv" ? "Se din nya profil" : "View Your New Profile") : formT.viewDirectoryBtn}
                </Link>
                <Link
                  href="/players"
                  className="w-full sm:w-auto px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-lg border border-zinc-200 transition-colors text-center"
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
                    className="font-bold text-rose-900 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Section 1: Basic Information with Global Country Select */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <div className="pb-3 border-b border-zinc-100 mb-5">
                  <h2 className="text-base font-bold text-zinc-950">{formT.step1Title}</h2>
                  <p className="text-xs text-zinc-500">{formT.step1Subtitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.firstName} *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Emil"
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
                      placeholder="e.g. Lindqvist"
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

                  {/* Complete Global Searchable Nationality Picker */}
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

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.currentClub} *</label>
                    <input
                      type="text"
                      required
                      value={formData.currentClub}
                      onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
                      placeholder="e.g. Sandvikens AIK"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  {/* Dynamic Country-filtered League Selector */}
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

              {/* Section 2: Athletic & Position Profile */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <div className="pb-3 border-b border-zinc-100 mb-5">
                  <h2 className="text-base font-bold text-zinc-950">{formT.step2Title}</h2>
                  <p className="text-xs text-zinc-500">{formT.step2Subtitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.position} *</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="goalkeeper">{t.positions.goalkeeper}</option>
                      <option value="defender">{t.positions.defender}</option>
                      <option value="halv">{t.positions.halv}</option>
                      <option value="midfielder">{t.positions.midfielder}</option>
                      <option value="forward">{t.positions.forward}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.stickGrip} *</label>
                    <select
                      value={formData.stickGrip}
                      onChange={(e) => setFormData({ ...formData, stickGrip: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="left">{t.grips.left}</option>
                      <option value="right">{t.grips.right}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.height}</label>
                    <input
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                      placeholder="e.g. 186"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.weight}</label>
                    <input
                      type="number"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      placeholder="e.g. 83"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.status} *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="seeking_26_27">{t.statuses.seeking_26_27}</option>
                      <option value="open_abroad">{t.statuses.open_abroad}</option>
                      <option value="contracted_transferable">{t.statuses.contracted_transferable}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2.5: Key Attributes on Ice (Max 4) */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <KeyAttributesPicker
                  selectedAttributes={formData.keyAttributes}
                  onChange={(attrs) => setFormData({ ...formData, keyAttributes: attrs })}
                  maxAttributes={4}
                />
              </div>

              {/* Section 3: Geographic Mobility & Target Destination Countries */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <div className="pb-3 border-b border-zinc-100 mb-5">
                  <h2 className="text-base font-bold text-zinc-950">{formT.targetCountriesTitle}</h2>
                  <p className="text-xs text-zinc-500">{formT.targetCountriesSubtitle}</p>
                </div>

                <TargetCountriesPicker
                  selectedCodes={formData.targetCountries}
                  onChange={(codes) => setFormData({ ...formData, targetCountries: codes })}
                />
              </div>

              {/* Section 3.5: National Team & FIB Eligibility (Heritage & Dual Citizenships) */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <div className="pb-3 border-b border-zinc-100 mb-5">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span>🌍</span>
                    <span>National Team Hub</span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-950">
                    {lang === "sv" ? "Landslag & Internationell behörighet" : "National Team & International Eligibility"}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {lang === "sv"
                      ? "Förbundskaptener från hela världen söker spelare med medborgarskap eller rötter (Heritage) för VM och mästerskap."
                      : "National team coaches worldwide are scouting players with dual passports or family ancestry."}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Open for national team checkbox */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.openForNationalTeam}
                      onChange={(e) => setFormData({ ...formData, openForNationalTeam: e.target.checked })}
                      className="mt-0.5 w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                    />
                    <div>
                      <span className="font-bold text-zinc-900 block">
                        🏆 {lang === "sv" ? "Jag är öppen för att representera ett landslag internationellt" : "I am open to representing a national team internationally"}
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        {lang === "sv"
                          ? "Gör din profil synlig för förbundskaptener i FIB:s medlemsländer."
                          : "Makes your profile discoverable for national team federations worldwide."}
                      </span>
                    </div>
                  </label>

                  {/* Dual Citizenship & Heritage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {lang === "sv" ? "Övriga medborgarskap / Dubbla pass" : "Secondary Citizenships / Passports"}
                      </label>
                      <TargetCountriesPicker
                        selectedCodes={formData.secondaryCitizenships}
                        onChange={(codes) => setFormData({ ...formData, secondaryCitizenships: codes })}
                        label={lang === "sv" ? "Välj länder där du har pass" : "Select countries where you hold a passport"}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {lang === "sv" ? "Landslagsanknytning / Rötter (Heritage)" : "Heritage / Family Ancestry"}
                      </label>
                      <input
                        type="text"
                        value={formData.heritageCountry}
                        onChange={(e) => setFormData({ ...formData, heritageCountry: e.target.value })}
                        placeholder={
                          lang === "sv"
                            ? "t.ex. Förälder född i Nederländerna / Rötter i Tyskland / USA..."
                            : "e.g. Grandparent born in Netherlands, German ancestry, US roots..."
                        }
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {lang === "sv"
                          ? "Många landslag tillåter spelare med mor-/farföräldrar från landet."
                          : "Many FIB nations allow players with parental or grandparent roots."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Civil Situation, Studies/Work & Spoken Languages */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="pb-3 border-b border-zinc-100">
                  <h2 className="text-base font-bold text-zinc-950">{formT.civilProfileTitle}</h2>
                  <p className="text-xs text-zinc-500">{formT.civilProfileSubtitle}</p>
                </div>

                {/* 5 Checkboxes for Occupation Preferences */}
                <div className="space-y-2.5">
                  <span className="block font-bold text-zinc-800 text-xs">
                    {lang === "sv" ? "Välj alla alternativ som matchar dina önskemål:" : "Select all options matching your preferences:"}
                  </span>

                  {/* 1. Studies */}
                  <label
                    onClick={() => handleToggleOccupation("studies")}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      formData.occupationPreferences.includes("studies")
                        ? "bg-zinc-900/5 border-zinc-900 text-zinc-950 font-semibold"
                        : "bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.occupationPreferences.includes("studies")}
                      onChange={() => {}} // handled by parent click
                      className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-1.5">
                        <span>🎓</span>
                        <span>{formT.optStudies}</span>
                      </span>
                    </div>
                  </label>

                  {/* 2. Fulltime Job */}
                  <label
                    onClick={() => handleToggleOccupation("fulltime_job")}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      formData.occupationPreferences.includes("fulltime_job")
                        ? "bg-zinc-900/5 border-zinc-900 text-zinc-950 font-semibold"
                        : "bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.occupationPreferences.includes("fulltime_job")}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-1.5">
                        <span>💼</span>
                        <span>{formT.optFulltimeJob}</span>
                      </span>
                    </div>
                  </label>

                  {/* 3. Parttime Job */}
                  <label
                    onClick={() => handleToggleOccupation("parttime_job")}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      formData.occupationPreferences.includes("parttime_job")
                        ? "bg-zinc-900/5 border-zinc-900 text-zinc-950 font-semibold"
                        : "bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.occupationPreferences.includes("parttime_job")}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-1.5">
                        <span>🕒</span>
                        <span>{formT.optParttimeJob}</span>
                      </span>
                    </div>
                  </label>

                  {/* 4. Housing */}
                  <label
                    onClick={() => handleToggleOccupation("housing")}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      formData.occupationPreferences.includes("housing")
                        ? "bg-zinc-900/5 border-zinc-900 text-zinc-950 font-semibold"
                        : "bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.occupationPreferences.includes("housing")}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-1.5">
                        <span>🏠</span>
                        <span>{formT.optHousing}</span>
                      </span>
                    </div>
                  </label>

                  {/* 5. Sports Only */}
                  <label
                    onClick={() => handleToggleOccupation("sports_only")}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      formData.occupationPreferences.includes("sports_only")
                        ? "bg-zinc-900/5 border-zinc-900 text-zinc-950 font-semibold"
                        : "bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200 text-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.occupationPreferences.includes("sports_only")}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-1.5">
                        <span>🏒</span>
                        <span>{formT.optSportsOnly}</span>
                      </span>
                    </div>
                  </label>
                </div>

                {/* Spoken Languages Picker */}
                <div className="pt-4 border-t border-zinc-100">
                  <SpokenLanguagesPicker
                    selectedLanguages={formData.spokenLanguages}
                    onChange={(langs) => setFormData({ ...formData, spokenLanguages: langs })}
                    label={formT.spokenLanguagesTitle}
                    subtitle={formT.spokenLanguagesSubtitle}
                  />
                </div>
              </div>

              {/* Section 5: Merits & Video */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <div className="pb-3 border-b border-zinc-100 mb-5">
                  <h2 className="text-base font-bold text-zinc-950">{formT.step4Title}</h2>
                  <p className="text-xs text-zinc-500">{formT.step4Subtitle}</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.bioHistory} *</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.bioHistory}
                      onChange={(e) => setFormData({ ...formData, bioHistory: e.target.value })}
                      placeholder={formT.bioPlaceholder}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.videoLink}</label>
                    <input
                      type="url"
                      value={formData.videoLink}
                      onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                      placeholder={formT.videoPlaceholder}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Contact Information */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                <div className="pb-3 border-b border-zinc-100 mb-5">
                  <h2 className="text-base font-bold text-zinc-950">{formT.step5Title}</h2>
                  <p className="text-xs text-zinc-500">{formT.step5Subtitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-5">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">{formT.email} *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="player@example.com"
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

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-zinc-600 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-0.5 rounded border-zinc-300 text-zinc-900"
                    />
                    <span>{formT.consent}</span>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/players"
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>{formT.submitBtn}</span>
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
