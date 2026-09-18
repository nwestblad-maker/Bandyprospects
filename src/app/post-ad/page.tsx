"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { ContactPrivacySettings } from "@/components/ContactPrivacySettings";
import { GdprConsentCheckbox } from "@/components/GdprConsentCheckbox";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { PositionCategory, TeamCategory, OrgType } from "@/types";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeaguesForCountry } from "@/lib/leagues";

export default function PostAdPage() {
  const { t } = useLanguage();
  const formT = t.postAdPage;

  // Form state
  const [formData, setFormData] = useState({
    orgType: "club" as OrgType,
    tournament: "World Championship (A-Pool)",
    customTournament: "",
    eligibilityPassport: true,
    eligibilityHeritage: true,
    eligibilityFibQuota: false,
    clubName: "",
    country: "SE",
    city: "",
    division: "se_elitserien_herr",
    customDivision: "",
    teamCategory: "men" as TeamCategory,
    soughtPositions: ["halv", "defender"] as PositionCategory[],
    rolesDescription: "",
    description: "",
    contractTerm: "1_season",
    urgent: false,
    perkSalary: true,
    perkHousing: true,
    perkJob: true,
    perkStudies: false,
    perkTravel: false,
    perkGym: true,
    perkEquipment: true,
    compensationDetails: "",
    spokenLanguages: ["sv", "en"] as string[],
    contactName: "",
    contactRole: "Head of Scouting / Sports Director",
    contactEmail: "",
    contactPhone: "",
    showPhone: true,
    showEmail: true,
    contactPreference: "all" as "all" | "form_only",
    deadline: "",
    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleTogglePosition = (pos: PositionCategory) => {
    if (formData.soughtPositions.includes(pos)) {
      if (formData.soughtPositions.length === 1) {
        return;
      }
      setFormData({
        ...formData,
        soughtPositions: formData.soughtPositions.filter((p) => p !== pos),
      });
    } else {
      setFormData({
        ...formData,
        soughtPositions: [...formData.soughtPositions, pos],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.consent) {
      setErrorMessage("Please confirm the authorization consent checkbox to publish this listing.");
      return;
    }

    if (formData.soughtPositions.length === 0) {
      setErrorMessage("Please select at least one sought position.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Build benefits array
      const benefitsArray: string[] = [];
      if (formData.orgType === "national_team") {
        if (formData.perkTravel) benefitsArray.push("Travel support & flight reimbursement");
        if (formData.perkHousing) benefitsArray.push("Training camp & tournament accommodation");
        if (formData.perkSalary) benefitsArray.push("Tournament allowance & expense coverage");
        if (formData.perkJob) benefitsArray.push("Visa, citizenship & eligibility support");
        if (formData.perkEquipment) benefitsArray.push("Official national team kit & equipment");
        if (formData.perkGym) benefitsArray.push("Medical team & physiotherapy support");
      } else {
        if (formData.perkHousing) benefitsArray.push("Furnished accommodation arranged");
        if (formData.perkJob) benefitsArray.push("Civil employment support");
        if (formData.perkStudies) benefitsArray.push("Academic study adaptation");
        if (formData.perkSalary) benefitsArray.push("Contract salary / compensation");
        if (formData.perkTravel) benefitsArray.push("Travel coverage");
        if (formData.perkGym) benefitsArray.push("Gym & physio access");
        if (formData.perkEquipment) benefitsArray.push("Equipment & stick package");
      }
      if (formData.compensationDetails.trim()) {
        benefitsArray.push(formData.compensationDetails.trim());
      }

      // Build eligibility requirements array for national teams
      const eligibilityArray: string[] = [];
      if (formData.eligibilityPassport) {
        eligibilityArray.push("Requires Passport / Full Citizenship");
      }
      if (formData.eligibilityHeritage) {
        eligibilityArray.push("Open for Heritage / Dual Citizenship");
      }
      if (formData.eligibilityFibQuota) {
        eligibilityArray.push("FIB Non-Citizen 3-Player Quota");
      }

      const resolvedLeague =
        formData.orgType === "national_team"
          ? "FIB International / National Team"
          : formData.division === CUSTOM_OTHER_LEAGUE_VALUE
          ? formData.customDivision.trim() || "National League"
          : formData.division;

      const resolvedTournament =
        formData.orgType === "national_team"
          ? formData.tournament === "custom"
            ? formData.customTournament.trim()
            : formData.tournament
          : null;

      // Exact database column names for club_ads table
      const clubPayload = {
        club_name: formData.clubName.trim(),
        country: formData.country.toUpperCase(),
        league: resolvedLeague,
        city: formData.city.trim() || (formData.orgType === "national_team" ? "National Team Hub" : "Arena"),
        org_type: formData.orgType,
        tournament: resolvedTournament,
        eligibility_requirements: eligibilityArray,
        description: formData.description.trim(),
        roles_description: formData.rolesDescription.trim() || null,
        contact_name: formData.contactName.trim(),
        contact_role: formData.contactRole.trim(),
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim() || null,
        positions_needed: formData.soughtPositions,
        needed_position: formData.soughtPositions[0] || "",
        team_gender: formData.teamCategory,
        languages_spoken: formData.spokenLanguages,
        housing_provided: Boolean(formData.perkHousing),
        job_study_help: Boolean(formData.perkJob || formData.perkStudies),
        salary_offered: Boolean(formData.perkSalary),
        benefits: benefitsArray,
        show_phone: formData.showPhone,
        show_email: formData.showEmail,
        contact_preference: formData.contactPreference,
      };

      const { error } = await supabase
        .from("club_ads")
        .insert([clubPayload])
        .select();

      if (error) {
        console.error("Supabase insert error details:", JSON.stringify(error, null, 2));
        throw new Error(error.message || "Failed to publish advertisement.");
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header />

      <main className="flex-1">
        {/* Ingress Header */}
        <section className="bg-white border-b border-slate-200 py-10 sm:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-2" />
              {formT?.badge || "Club & Federation Recruitment"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {formT?.title || "Publish Recruitment Listing"}
            </h1>
            <p className="text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
              {formT?.subtitle || "Reach players, agents, and scouts worldwide. Announce roster vacancies, trial days, or national team opportunities."}
            </p>
          </div>
        </section>

        {/* Content & Form Container */}
        <section className="py-8 sm:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {isSubmitted ? (
              /* Success Confirmation Card */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formT?.successTitle || "Listing Published Successfully!"}
                </h2>
                <p className="text-base text-slate-600 leading-relaxed max-w-md mx-auto">
                  {formT?.successDesc || "Your opportunity is now visible on the Transfer & Club Opportunities Market."}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/market"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors text-center cursor-pointer"
                  >
                    {formT?.viewMarketBtn || "View Market Listings →"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-5 py-2.5 rounded-lg transition-colors text-center cursor-pointer"
                  >
                    + Post Another Listing
                  </button>
                </div>
              </div>
            ) : (
              /* Opportunity Form */
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Error Alert */}
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

                {/* Organization Type Selector: Club vs National Team */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                    Recruiting Organization Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, orgType: "club" })}
                      className={`p-5 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        formData.orgType === "club"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm font-semibold"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-2xl">🏟️</span>
                      <div>
                        <div className="font-bold text-base">Club Team</div>
                        <div className={`text-xs mt-1 leading-relaxed ${formData.orgType === "club" ? "text-slate-300" : "text-slate-500"}`}>
                          Recruiting for regular league play, cups, and seasonal squad building.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, orgType: "national_team" })}
                      className={`p-5 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        formData.orgType === "national_team"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm font-semibold"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-2xl">🌍</span>
                      <div>
                        <div className="font-bold text-base">National Team / Federation</div>
                        <div className={`text-xs mt-1 leading-relaxed ${formData.orgType === "national_team" ? "text-slate-300" : "text-slate-500"}`}>
                          Federation scouting, World Championship rosters, dual-citizenship & FIB quotas.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 1: Details */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="pb-3 border-b border-slate-100">
                    <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                      <span className="font-bold mr-1.5">1</span>
                      <span>{formData.orgType === "national_team" ? "National Team & Federation Details" : "Club & League Information"}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {formData.orgType === "national_team"
                        ? "National Team & Federation Information"
                        : (formT?.step1Title || "Club & League Information")}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{formT?.step1Subtitle || "Specify team identity, country, and competitive division."}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        {formData.orgType === "national_team"
                          ? "National Team / Federation Name *"
                          : "Club Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.clubName}
                        onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                        placeholder={
                          formData.orgType === "national_team"
                            ? "e.g. Netherlands National Bandy Team / German Bandy Federation"
                            : "e.g. Västerås Bandy BK"
                        }
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>

                    {/* Country Select */}
                    <div>
                      <CountrySelect
                        label={formT?.country || "Country *"}
                        required
                        value={formData.country}
                        onChange={(code) => {
                          const upper = code.toUpperCase();
                          const available = getLeaguesForCountry(upper);
                          const newLeague = available[0]?.id || "other_national_league";
                          setFormData({
                            ...formData,
                            country: upper,
                            division: newLeague,
                            customDivision: "",
                          });
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        {formData.orgType === "national_team"
                          ? "Base / Federation HQ *"
                          : "City / Arena Location *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder={formData.orgType === "national_team" ? "e.g. Amsterdam / Frankfurt" : "e.g. Västerås (ABB Arena)"}
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>

                    {/* League / Tournament */}
                    {formData.orgType === "national_team" ? (
                      <div className="sm:col-span-2 space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                            Tournament / Championship *
                          </label>
                          <select
                            value={formData.tournament}
                            onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
                            className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                          >
                            <option value="World Championship (A-Pool)">🏆 World Championship (A-Pool)</option>
                            <option value="World Championship (B-Pool)">🌍 World Championship (B-Pool)</option>
                            <option value="Women's World Championship">🥇 Women&apos;s World Championship</option>
                            <option value="Youth World Championship (U19/U17)">⭐ Youth World Championship (U19/U17)</option>
                            <option value="International Invitational Tournament">🏒 International Invitational Tournament</option>
                            <option value="custom">Other (specify)...</option>
                          </select>
                        </div>

                        {formData.tournament === "custom" && (
                          <div>
                            <input
                              type="text"
                              required
                              value={formData.customTournament}
                              onChange={(e) => setFormData({ ...formData, customTournament: e.target.value })}
                              placeholder="Enter tournament name..."
                              className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                            />
                          </div>
                        )}

                        {/* FIB Eligibility Requirements Checkboxes */}
                        <div className="pt-2">
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            FIB Eligibility Requirements
                          </label>
                          <div className="space-y-2.5">
                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.eligibilityPassport}
                                onChange={(e) => setFormData({ ...formData, eligibilityPassport: e.target.checked })}
                                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                              />
                              <span className="font-medium text-slate-800 text-sm">
                                🛂 Requires Passport / Full Citizenship
                              </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.eligibilityHeritage}
                                onChange={(e) => setFormData({ ...formData, eligibilityHeritage: e.target.checked })}
                                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                              />
                              <span className="font-medium text-slate-800 text-sm">
                                🧬 Open for Heritage / Dual Citizenship / Ancestry
                              </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.eligibilityFibQuota}
                                onChange={(e) => setFormData({ ...formData, eligibilityFibQuota: e.target.checked })}
                                className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                              />
                              <span className="font-medium text-slate-800 text-sm">
                                🌐 Seeking players for FIB Non-Citizen 3-Player Quota
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Dynamic Country-filtered League Selector for Clubs */
                      <div>
                        <LeagueSelect
                          countryCode={formData.country}
                          value={formData.division}
                          onChange={(l) => setFormData({ ...formData, division: l })}
                          customLeagueName={formData.customDivision}
                          onCustomLeagueNameChange={(c) => setFormData({ ...formData, customDivision: c })}
                          label={formT?.division || "Current League / Division"}
                          required
                        />
                      </div>
                    )}

                    <div className={formData.orgType === "national_team" ? "sm:col-span-2" : ""}>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{formT?.teamCategory || "Team Category"} *</label>
                      <select
                        value={formData.teamCategory}
                        onChange={(e) => setFormData({ ...formData, teamCategory: e.target.value as TeamCategory })}
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer"
                      >
                        <option value="men">Men&apos;s Team</option>
                        <option value="women">Women&apos;s Team</option>
                        <option value="junior">Junior / Development Squad</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Sought Positions & Roles */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="pb-3 border-b border-slate-100">
                    <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                      <span className="font-bold mr-1.5">2</span>
                      <span>Positions & Role Expectations</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{formT?.soughtPositionsTitle || "Sought Positions & Player Profiles"}</h2>
                    <p className="text-sm text-slate-500 mt-1">{formT?.soughtPositionsSubtitle || "Choose the roles you are actively recruiting."}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Position Buttons */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 block">
                        Target Positions (Click to select) *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[
                          { id: "goalkeeper", label: "Goalkeeper" },
                          { id: "defender", label: "Defender" },
                          { id: "halv", label: "Halv" },
                          { id: "midfielder", label: "Midfielder" },
                          { id: "forward", label: "Forward" },
                        ].map((pos) => {
                          const isSelected = formData.soughtPositions.includes(pos.id as PositionCategory);
                          return (
                            <button
                              type="button"
                              key={pos.id}
                              onClick={() => handleTogglePosition(pos.id as PositionCategory)}
                              className={`p-3.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                              }`}
                            >
                              <div className="text-sm">{pos.label}</div>
                              <div className="text-xs mt-1 opacity-80">
                                {isSelected ? "✓ Selected" : "+ Select"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Role Description */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Role Requirements & Tactical Profile
                      </label>
                      <textarea
                        rows={3}
                        value={formData.rolesDescription}
                        onChange={(e) => setFormData({ ...formData, rolesDescription: e.target.value })}
                        placeholder="e.g. Seeking an offensive halv with strong skating power and corner shooting, or a physical centre back..."
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>

                    {/* General Description */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        General Description & Opportunity Overview *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your organization, team ambitions, training culture, and what kind of prospect you are looking for..."
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Club Offer / Federation Support */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="pb-3 border-b border-slate-100">
                    <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                      <span className="font-bold mr-1.5">3</span>
                      <span>Compensation & Benefits</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {formData.orgType === "national_team"
                        ? "Federation Conditions & Support"
                        : "Club Offer & Package"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {formData.orgType === "national_team"
                        ? "Select what the federation provides for camps, championships, and travel."
                        : "Select provided benefits and compensation details."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {formData.orgType === "national_team" ? (
                      /* Federation Support Checkboxes */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkTravel}
                            onChange={(e) => setFormData({ ...formData, perkTravel: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">
                            ✈️ Travel Support & Flight Reimbursement
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkHousing}
                            onChange={(e) => setFormData({ ...formData, perkHousing: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">
                            🏨 Training Camp & Tournament Accommodation
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkSalary}
                            onChange={(e) => setFormData({ ...formData, perkSalary: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">
                            💰 Tournament Allowance & Expense Coverage
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkJob}
                            onChange={(e) => setFormData({ ...formData, perkJob: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">
                            🛂 Visa, Citizenship & FIB Eligibility Support
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkEquipment}
                            onChange={(e) => setFormData({ ...formData, perkEquipment: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">
                            🏒 Official National Team Kit & Gear Package
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkGym}
                            onChange={(e) => setFormData({ ...formData, perkGym: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">
                            🩺 Medical Team, Physio & Rehab Support
                          </span>
                        </label>
                      </div>
                    ) : (
                      /* Club Offer Checkboxes */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkHousing}
                            onChange={(e) => setFormData({ ...formData, perkHousing: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">🏠 Furnished Housing Arranged</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkSalary}
                            onChange={(e) => setFormData({ ...formData, perkSalary: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">💰 Contract Salary / Allowance</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkJob}
                            onChange={(e) => setFormData({ ...formData, perkJob: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">💼 Civil Employment Match</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkStudies}
                            onChange={(e) => setFormData({ ...formData, perkStudies: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">🎓 University / Study Support</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkTravel}
                            onChange={(e) => setFormData({ ...formData, perkTravel: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">✈️ Travel Coverage</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkEquipment}
                            onChange={(e) => setFormData({ ...formData, perkEquipment: e.target.checked })}
                            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-0"
                          />
                          <span className="font-medium text-slate-800 text-sm">🏒 Equipment & Stick Package</span>
                        </label>
                      </div>
                    )}

                    {/* Team Spoken Languages */}
                    <div className="pt-3 border-t border-slate-100">
                      <SpokenLanguagesPicker
                        selectedLanguages={formData.spokenLanguages}
                        onChange={(langs) => setFormData({ ...formData, spokenLanguages: langs })}
                        label="Languages Spoken in the Dressing Room & Club"
                        subtitle="Help international candidates understand language requirements."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Contact & Verification */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="pb-3 border-b border-slate-100">
                    <div className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md mb-2">
                      <span className="font-bold mr-1.5">4</span>
                      <span>Contact & Privacy</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{formT?.step4Title || "Contact Official & Privacy"}</h2>
                    <p className="text-sm text-slate-500 mt-1">{formT?.step4Subtitle || "Provide verified contact information for inquiries."}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="e.g. Anders Johansson"
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Club / Federation Role *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactRole}
                        onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                        placeholder="e.g. Head of Scouting / General Manager"
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Official Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="scouting@club.com"
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+46 70 123 45 67"
                        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <ContactPrivacySettings
                    showPhone={formData.showPhone}
                    setShowPhone={(val) => setFormData((prev) => ({ ...prev, showPhone: val }))}
                    showEmail={formData.showEmail}
                    setShowEmail={(val) => setFormData((prev) => ({ ...prev, showEmail: val }))}
                    contactPreference={formData.contactPreference}
                    setContactPreference={(val) => setFormData((prev) => ({ ...prev, contactPreference: val }))}
                    entityType="club"
                  />

                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <GdprConsentCheckbox
                      checked={formData.consent}
                      onChange={(checked) => setFormData({ ...formData, consent: checked })}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href="/market"
                    className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{isSubmitting ? "Publishing Listing..." : (formT?.submitBtn || "Publish Listing →")}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
