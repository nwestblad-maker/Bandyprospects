"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { TargetCountriesPicker } from "@/components/TargetCountriesPicker";
import { AvatarUpload } from "@/components/AvatarUpload";
import { GdprConsentCheckbox } from "@/components/GdprConsentCheckbox";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { ContactPrivacySettings } from "@/components/ContactPrivacySettings";
import { BandyTraitsPicker } from "@/components/BandyTraitsPicker";
import { CareerHistoryEditor } from "@/components/CareerHistoryEditor";
import { supabase } from "@/lib/supabaseClient";
import { CareerSeason, OccupationPreference, PlayerGrip, PositionCategory } from "@/types";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeaguesForCountry, getLeagueDisplayName } from "@/lib/leagues";

export default function JoinPage() {
  // Form State
  const [formData, setFormData] = useState({
    // Section A: Grundfakta & Fysik
    firstName: "",
    lastName: "",
    birthYear: "2003",
    nationality: "se",
    photoUrl: "",
    youthClub: "",
    academyType: "none" as "NIU" | "international" | "local" | "none",
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
      setErrorMessage("Please confirm the verification consent checkbox to publish your profile.");
      return;
    }

    try {
      setIsSubmitting(true);

      const birthYearNum = parseInt(formData.birthYear, 10) || 2000;

      const resolvedLeagueName =
        formData.league === CUSTOM_OTHER_LEAGUE_VALUE
          ? formData.customLeague.trim()
          : getLeagueDisplayName(formData.league, "en");

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-2" />
              Bandy Prospects Player Registration
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Create Your Player Profile
            </h1>
            <p className="text-base text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
              Fill in your bandy credentials, physical attributes, and career history to reach scouts, sporting directors, and club managers.
            </p>
          </div>

          {/* Submission Success Confirmation */}
          {isSubmitted ? (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Profile Published Successfully!</h2>
              <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">
                Your player prospect card is now visible to clubs, scouts, and national team representatives worldwide.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {createdPlayerId && (
                  <Link
                    href={`/players/${createdPlayerId}`}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors text-center cursor-pointer"
                  >
                    View Your New Profile →
                  </Link>
                )}
                <Link
                  href="/players"
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-5 py-2.5 rounded-lg transition-colors text-center cursor-pointer"
                >
                  Browse Prospect Directory
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error alert if any */}
              {errorMessage && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
                  <span>⚠️ {errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="font-bold text-rose-900 hover:underline cursor-pointer ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* SECTION A: BASIC DETAILS & BACKGROUND */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                    <span className="font-bold mr-1.5">A</span>
                    <span>Basic Details & Background</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Information, Youth Background & Physical Metrics</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Bandy background from origin youth club to sports academy and physical metrics.
                  </p>
                </div>

                {/* Avatar / Photo Upload */}
                <AvatarUpload
                  currentUrl={formData.photoUrl}
                  onUploadSuccess={(url) => setFormData({ ...formData, photoUrl: url })}
                />

                {/* Namn & Födelseår */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Erik"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Pettersson"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Birth Year *
                    </label>
                    <input
                      type="number"
                      required
                      min="1975"
                      max="2015"
                      value={formData.birthYear}
                      onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                      placeholder="2003"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    />
                  </div>
                </div>

                {/* Nationality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <CountrySelect
                      label="Primary Nationality *"
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

                {/* Origin / Youth Club & Sports Academy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Origin / Youth Club
                    </label>
                    <input
                      type="text"
                      value={formData.youthClub}
                      onChange={(e) => setFormData({ ...formData, youthClub: e.target.value })}
                      placeholder="e.g. Vetlanda BK, Brobergs IF, Edsbyns IF, Bollnäs GIF"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      The youth club where you grew up and learned to play bandy.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Sports Academy / Bandy High School
                    </label>
                    <select
                      value={formData.academyType}
                      onChange={(e) => setFormData({ ...formData, academyType: e.target.value as "NIU" | "international" | "local" | "none" })}
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                    >
                      <option value="none">None</option>
                      <option value="NIU">NIU Bandy Academy (Sweden)</option>
                      <option value="international">Sports Academy (International)</option>
                      <option value="local">Sports Academy (Local / Other)</option>
                    </select>
                  </div>
                </div>

                {/* Fysik & Fattning */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min="140"
                      max="220"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                      placeholder="e.g. 185"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="140"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      placeholder="e.g. 82"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Stick Grip *
                    </label>
                    <select
                      value={formData.stickGrip}
                      onChange={(e) => setFormData({ ...formData, stickGrip: e.target.value as PlayerGrip })}
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                    >
                      <option value="left">Left (L)</option>
                      <option value="right">Right (R)</option>
                    </select>
                  </div>
                </div>

                {/* Nuvarande klubb & Serie */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Current / Latest Club *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.currentClub}
                      onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
                      placeholder="e.g. Sandvikens AIK"
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    />
                  </div>

                  <div>
                    <LeagueSelect
                      countryCode={formData.nationality}
                      value={formData.league}
                      onChange={(l) => setFormData({ ...formData, league: l })}
                      customLeagueName={formData.customLeague}
                      onCustomLeagueNameChange={(c) => setFormData({ ...formData, customLeague: c })}
                      label="Current League / Division"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: POSITION & CORE TRAITS */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                    <span className="font-bold mr-1.5">B</span>
                    <span>Position & Core Traits</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">On-Ice Role & Specializations</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Define your primary position, versatility, and key attributes on the ice.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Primary Position *
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as PositionCategory })}
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                    >
                      <option value="halv">Halv</option>
                      <option value="midfielder">Midfielder</option>
                      <option value="defender">Defender</option>
                      <option value="forward">Forward</option>
                      <option value="goalkeeper">Goalkeeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Secondary Position (Optional)
                    </label>
                    <select
                      value={formData.secondaryPosition}
                      onChange={(e) => setFormData({ ...formData, secondaryPosition: e.target.value })}
                      className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                    >
                      <option value="">None / Primary position only</option>
                      <option value="halv">Halv</option>
                      <option value="midfielder">Midfielder</option>
                      <option value="defender">Defender</option>
                      <option value="forward">Forward</option>
                      <option value="goalkeeper">Goalkeeper</option>
                    </select>
                  </div>
                </div>

                {/* Spetsegenskaper Multi-Select Tags */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Key Traits & Strengths (Click to select your best attributes) *
                  </label>
                  <BandyTraitsPicker
                    selectedTraits={formData.playerTraits}
                    onChange={(traits) => setFormData({ ...formData, playerTraits: traits })}
                    lang="en"
                  />
                </div>
              </div>

              {/* SECTION C: CONTRACT & CIVIL PREFERENCES */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                    <span className="font-bold mr-1.5">C</span>
                    <span>Contract & Civil Preferences</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Contract Status, Highlights & Mobility</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Provide clear details about your current contract situation, video tape, and civil career aspirations.
                  </p>
                </div>

                {/* Kontraktsstatus Select */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Contract Status *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "free_agent",
                        title: "Free Agent / Seeking Club",
                        desc: "Ready for immediate transfer discussions",
                      },
                      {
                        id: "expiring_26_27",
                        title: "Expiring Contract 2026/27",
                        desc: "Under contract, exploring future options",
                      },
                      {
                        id: "under_contract_loan",
                        title: "Under Contract (Seeking Loan)",
                        desc: "Looking for dual registration or loan",
                      },
                    ].map((opt) => {
                      const isSelected = formData.contractStatus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, contractStatus: opt.id as any })}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm font-semibold"
                              : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">{opt.title}</span>
                            {isSelected && <span>✓</span>}
                          </div>
                          <p className={`text-xs leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Video / Highlights URL Field */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    ▶️ Game Tape / Highlights (YouTube or Vimeo link)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Player profiles with video highlights receive up to 4x more inquiries from elite clubs and scouts.
                  </p>
                </div>

                {/* Contract Type / Package Preference */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Preferred Agreement Level:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "semi_pro",
                        title: "Semi-Professional",
                        desc: "Club salary + civil career / studies",
                      },
                      {
                        id: "full_time",
                        title: "Full-Time Pro",
                        desc: "Full-time professional salary & elite focus",
                      },
                      {
                        id: "amateur",
                        title: "Amateur / Development",
                        desc: "Club placement with housing & employment help",
                      },
                    ].map((opt) => {
                      const isSelected = formData.contractType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, contractType: opt.id })}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm font-semibold"
                              : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">{opt.title}</span>
                            {isSelected && <span>✓</span>}
                          </div>
                          <p className={`text-xs leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Checkboxes for Occupation Preferences */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    Civil preferences (Combine bandy with):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: "studies", icon: "🎓", label: "University / Academic Studies" },
                      { id: "fulltime_job", icon: "💼", label: "Full-Time Employment" },
                      { id: "parttime_job", icon: "🕒", label: "Part-Time / Flexible Job" },
                      { id: "housing", icon: "🏠", label: "Club Housing Assistance" },
                      { id: "sports_only", icon: "🏒", label: "Sports Only / Pro Contract" },
                    ].map((item) => (
                      <label
                        key={item.id}
                        onClick={() => handleToggleOccupation(item.id as OccupationPreference)}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                          formData.occupationPreferences.includes(item.id as OccupationPreference)
                            ? "bg-slate-50 border-slate-900 text-slate-950 font-semibold"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.occupationPreferences.includes(item.id as OccupationPreference)}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-300 text-slate-900"
                        />
                        <span className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Geographic Mobility (Target Countries) */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Target Countries & International Mobility
                  </label>
                  <TargetCountriesPicker
                    selectedCodes={formData.targetCountries}
                    onChange={(codes) => setFormData({ ...formData, targetCountries: codes })}
                  />
                </div>

                {/* Spoken Languages */}
                <div className="pt-3 border-t border-slate-100">
                  <SpokenLanguagesPicker
                    selectedLanguages={formData.spokenLanguages}
                    onChange={(langs) => setFormData({ ...formData, spokenLanguages: langs })}
                    label="Languages Spoken"
                    subtitle="Select all languages you speak comfortably for international scout communication."
                  />
                </div>

                {/* Presentation Text */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    Player Statement & Ambitions
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bioHistory}
                    onChange={(e) => setFormData({ ...formData, bioHistory: e.target.value })}
                    placeholder="Describe your playing style, career goals, and what you are looking for in a prospective club..."
                    className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  />
                </div>

                {/* Social Links (Optional) */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-700 mb-2 block">
                    Social Media Channels (Optional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">📸 Instagram</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/..."
                        className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">▶️ YouTube Channel</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/..."
                        className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={formData.youtube_url}
                        onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">🎵 TikTok</label>
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@..."
                        className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        value={formData.tiktok_url}
                        onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information & Privacy */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+46 70 123 45 67"
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
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

              {/* SECTION D: CAREER HISTORY & PAST CLUBS */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                    <span className="font-bold mr-1.5">D</span>
                    <span>Career History</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Past Clubs & Seasons</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Add previous seasons and clubs you have represented. Displayed in your profile career table.
                  </p>
                </div>

                <CareerHistoryEditor
                  careerHistory={formData.careerHistory}
                  onChange={(history) => setFormData({ ...formData, careerHistory: history })}
                  lang="en"
                />
              </div>

              {/* GDPR Samtycke */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
                <GdprConsentCheckbox
                  checked={formData.consent}
                  onChange={(checked) => setFormData({ ...formData, consent: checked })}
                />
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/players"
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Publish Player Profile</span>
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
