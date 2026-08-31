"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { SpokenLanguagesPicker } from "@/components/SpokenLanguagesPicker";
import { GdprConsentCheckbox } from "@/components/GdprConsentCheckbox";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { PositionCategory, TeamCategory, OrgType } from "@/types";
import { CUSTOM_OTHER_LEAGUE_VALUE, getLeaguesForCountry } from "@/lib/leagues";

export default function PostAdPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const formT = t.postAdPage;

  // Form state
  const [formData, setFormData] = useState({
    orgType: "club" as OrgType,
    tournament: "World Championship (VM A-Pool)",
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
    contactRole: "Sportchef",
    contactEmail: "",
    contactPhone: "",
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
      setErrorMessage(
        lang === "sv"
          ? "Vänligen bekräfta representationsrutan för att publicera annonsen."
          : "Please confirm the authorization consent checkbox."
      );
      return;
    }

    if (formData.soughtPositions.length === 0) {
      setErrorMessage(
        lang === "sv"
          ? "Vänligen välj minst en sökt position."
          : "Please select at least one sought position."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Build benefits array
      const benefitsArray: string[] = [];
      if (formData.orgType === "national_team") {
        if (formData.perkTravel) benefitsArray.push("Travel support & flights / Resestöd & flygbiljetter");
        if (formData.perkHousing) benefitsArray.push("Training camp accommodation / Boende under samlingar");
        if (formData.perkSalary) benefitsArray.push("Tournament allowance / Tävlingstraktamente");
        if (formData.perkJob) benefitsArray.push("Visa & citizenship support / Visum- & medborgarskapsstöd");
        if (formData.perkEquipment) benefitsArray.push("National team kit & equipment / Match- & träningsställ");
        if (formData.perkGym) benefitsArray.push("Medical team & physio / Medicinskt team & fysioterapi");
      } else {
        if (formData.perkHousing) benefitsArray.push("Housing arranged / Möblerat boende");
        if (formData.perkJob) benefitsArray.push("Civil job support / Civilt arbete");
        if (formData.perkStudies) benefitsArray.push("Study support / Studieanpassning");
        if (formData.perkSalary) benefitsArray.push("Contract salary / Spelarersättning");
        if (formData.perkTravel) benefitsArray.push("Travel coverage / Reseersättning");
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
          ? "FIB International / Landslag"
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />

      <main className="flex-1">
        {/* Ingress Header */}
        <section className="bg-white border-b border-zinc-200 py-10 sm:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
              {formT.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {formT.title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-2xl leading-relaxed">
              {formT.subtitle}
            </p>
          </div>
        </section>

        {/* Content & Form Container */}
        <section className="py-8 sm:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {isSubmitted ? (
              /* Success Confirmation Card */
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  ✓
                </div>
                <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight mb-2">
                  {formT.successTitle}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 mb-8 leading-relaxed max-w-md mx-auto">
                  {formT.successDesc}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/market"
                    className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors text-center"
                  >
                    {formT.viewMarketBtn}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-lg border border-zinc-200 transition-colors text-center cursor-pointer"
                  >
                    {lang === "sv" ? "+ Skapa en till annons" : "+ Post Another Ad"}
                  </button>
                </div>
              </div>
            ) : (
              /* Opportunity Form */
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Error Alert */}
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

                {/* Organization Type Selector: Club vs National Team */}
                <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-xs">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    {lang === "sv" ? "Vem söker spelare?" : "Who is recruiting?"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, orgType: "club" })}
                      className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formData.orgType === "club"
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs font-semibold"
                          : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <span className="text-xl">🏟️</span>
                      <div>
                        <div className="font-bold">{lang === "sv" ? "Klubblag (Club Team)" : "Club Team"}</div>
                        <div className={`text-[11px] mt-0.5 ${formData.orgType === "club" ? "text-zinc-300" : "text-zinc-500"}`}>
                          {lang === "sv" ? "Rekrytering inför ordinarie seriespel och cupspel." : "Recruiting for regular club leagues and tournaments."}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, orgType: "national_team" })}
                      className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formData.orgType === "national_team"
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs font-semibold"
                          : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <span className="text-xl">🌍</span>
                      <div>
                        <div className="font-bold">{lang === "sv" ? "National Team / Landslag" : "National Team / Federation"}</div>
                        <div className={`text-[11px] mt-0.5 ${formData.orgType === "national_team" ? "text-zinc-300" : "text-zinc-500"}`}>
                          {lang === "sv" ? "Förbundsrekrytering, VM-trupper & FIB-kvoter." : "National team scouting, World Championship rosters & FIB eligibility."}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 1: Details */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                  <div className="pb-3 border-b border-zinc-100 mb-5">
                    <h2 className="text-base font-bold text-zinc-950">
                      {formData.orgType === "national_team"
                        ? lang === "sv"
                          ? "1. Landslag & Förbundsuppgifter"
                          : "1. National Team & Federation Details"
                        : formT.step1Title}
                    </h2>
                    <p className="text-xs text-zinc-500">{formT.step1Subtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formData.orgType === "national_team"
                          ? lang === "sv"
                            ? "Landslag / Förbundets namn *"
                            : "National Team / Federation Name *"
                          : `${formT.clubName} *`}
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
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    {/* Global Searchable Country Select */}
                    <div>
                      <CountrySelect
                        label={formT.country}
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
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formData.orgType === "national_team"
                          ? lang === "sv"
                            ? "Huvudsäte / Bas"
                            : "Base / Federation HQ"
                          : `${formT.city} *`}
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder={formData.orgType === "national_team" ? "e.g. Amsterdam / Frankfurt" : "e.g. Västerås (ABB Arena)"}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    {/* League / Tournament */}
                    {formData.orgType === "national_team" ? (
                      <div className="sm:col-span-2 space-y-3">
                        <div>
                          <label className="block font-semibold text-zinc-700 mb-1">
                            {lang === "sv" ? "Turnering / Mästerskap *" : "Tournament / Championship *"}
                          </label>
                          <select
                            value={formData.tournament}
                            onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                          >
                            <option value="World Championship (VM A-Pool)">🏆 World Championship (VM A-Gruppen)</option>
                            <option value="World Championship (VM B-Pool)">🌍 World Championship (VM B-Gruppen)</option>
                            <option value="Women's World Championship (Dam-VM)">🥇 Women&apos;s World Championship (Dam-VM)</option>
                            <option value="Youth World Championship (U19/U17)">⭐ Youth World Championship (U19/U17)</option>
                            <option value="International Invitational Tournament">🏒 International Invitational Tournament</option>
                            <option value="custom">{lang === "sv" ? "Annat (skriv själv)..." : "Other (write custom)..."}</option>
                          </select>
                        </div>

                        {formData.tournament === "custom" && (
                          <div>
                            <input
                              type="text"
                              required
                              value={formData.customTournament}
                              onChange={(e) => setFormData({ ...formData, customTournament: e.target.value })}
                              placeholder={lang === "sv" ? "Ange mästerskapets namn..." : "Enter tournament name..."}
                              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                            />
                          </div>
                        )}

                        {/* FIB Eligibility Requirements Checkboxes */}
                        <div className="pt-2">
                          <label className="block font-semibold text-zinc-700 mb-2">
                            {lang === "sv" ? "Behörighetskrav (FIB Eligibility Requirements)" : "FIB Eligibility Requirements"}
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.eligibilityPassport}
                                onChange={(e) => setFormData({ ...formData, eligibilityPassport: e.target.checked })}
                                className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                              />
                              <span className="font-medium text-zinc-800">
                                🛂 {lang === "sv" ? "Kräver pass / fullt medborgarskap" : "Requires Passport / Full Citizenship"}
                              </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.eligibilityHeritage}
                                onChange={(e) => setFormData({ ...formData, eligibilityHeritage: e.target.checked })}
                                className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                              />
                              <span className="font-medium text-zinc-800">
                                🧬 {lang === "sv" ? "Öppen för dubbelt medborgarskap / anknytning (Heritage)" : "Open for Heritage / Dual Citizenship / Ancestry"}
                              </span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.eligibilityFibQuota}
                                onChange={(e) => setFormData({ ...formData, eligibilityFibQuota: e.target.checked })}
                                className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                              />
                              <span className="font-medium text-zinc-800">
                                🌐 {lang === "sv" ? "Söker spelare för FIB:s kvot för icke-medborgare (3-spelar-regeln)" : "Seeking players for FIB Non-Citizen 3-Player Quota"}
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
                          label={formT.division}
                          required
                        />
                      </div>
                    )}

                    <div className={formData.orgType === "national_team" ? "sm:col-span-2" : ""}>
                      <label className="block font-semibold text-zinc-700 mb-1">{formT.teamCategory} *</label>
                      <select
                        value={formData.teamCategory}
                        onChange={(e) => setFormData({ ...formData, teamCategory: e.target.value as TeamCategory })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                      >
                        <option value="men">{formT.teamTypeMen}</option>
                        <option value="women">{formT.teamTypeWomen}</option>
                        <option value="junior">{formT.teamTypeJunior}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Sought Positions & Roles */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                  <div className="pb-3 border-b border-zinc-100 mb-5">
                    <h2 className="text-base font-bold text-zinc-950">{formT.soughtPositionsTitle}</h2>
                    <p className="text-xs text-zinc-500">{formT.soughtPositionsSubtitle}</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Position Buttons */}
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-2">
                        {formT.targetPosition} *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { id: "goalkeeper", label: t.positions.goalkeeper },
                          { id: "defender", label: t.positions.defender },
                          { id: "halv", label: t.positions.halv },
                          { id: "midfielder", label: t.positions.midfielder },
                          { id: "forward", label: t.positions.forward },
                        ].map((pos) => {
                          const isSelected = formData.soughtPositions.includes(pos.id as PositionCategory);
                          return (
                            <button
                              type="button"
                              key={pos.id}
                              onClick={() => handleTogglePosition(pos.id as PositionCategory)}
                              className={`p-3 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                              }`}
                            >
                              <div className="text-xs">{pos.label}</div>
                              <div className="text-[10px] mt-0.5 opacity-80">
                                {isSelected ? "✓ Vald" : "+ Välj"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Role Description */}
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formT.rolesDescription}
                      </label>
                      <textarea
                        rows={3}
                        value={formData.rolesDescription}
                        onChange={(e) => setFormData({ ...formData, rolesDescription: e.target.value })}
                        placeholder={formT.rolesPlaceholder}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    {/* General Description */}
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formT.description} *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={formT.descriptionPlaceholder}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Club Offer / Federation Support */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                  <div className="pb-3 border-b border-zinc-100 mb-5">
                    <h2 className="text-base font-bold text-zinc-950">
                      {formData.orgType === "national_team"
                        ? lang === "sv"
                          ? "3. Förbundets förutsättningar och stöd"
                          : "3. Federation Conditions & Support"
                        : formT.clubOfferTitle}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {formData.orgType === "national_team"
                        ? lang === "sv"
                          ? "Markera vad förbundet tillhandahåller och bistår med inför samlingar och mästerskap."
                          : "Select what the federation provides for training camps, championships, and travel."
                        : formT.clubOfferSubtitle}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    {formData.orgType === "national_team" ? (
                      /* Federation Support Checkboxes */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkTravel}
                            onChange={(e) => setFormData({ ...formData, perkTravel: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">
                            ✈️ {lang === "sv" ? "Resestöd / Flygbiljetter (Travel support)" : "Travel Support & Flight Reimbursement"}
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkHousing}
                            onChange={(e) => setFormData({ ...formData, perkHousing: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">
                            🏨 {lang === "sv" ? "Hotell & boende under samlingar (Camp accommodation)" : "Training Camp & Tournament Accommodation"}
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkSalary}
                            onChange={(e) => setFormData({ ...formData, perkSalary: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">
                            💰 {lang === "sv" ? "Tävlingstraktamente / Ersättning (Tournament allowance)" : "Tournament Allowance & Expense Coverage"}
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkJob}
                            onChange={(e) => setFormData({ ...formData, perkJob: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">
                            🛂 {lang === "sv" ? "Stöd med visum, FIB-dispens & medborgarskap (Visa support)" : "Visa, Citizenship & FIB Eligibility Support"}
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkEquipment}
                            onChange={(e) => setFormData({ ...formData, perkEquipment: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">
                            🏒 {lang === "sv" ? "Landslagsdräkt & utrustningspaket (Team gear)" : "Official National Team Kit & Gear Package"}
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkGym}
                            onChange={(e) => setFormData({ ...formData, perkGym: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">
                            🩺 {lang === "sv" ? "Medicinskt team, fysioterapi & rehab (Medical staff)" : "Medical Team, Physio & Rehab Support"}
                          </span>
                        </label>
                      </div>
                    ) : (
                      /* Club Offer Checkboxes */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkHousing}
                            onChange={(e) => setFormData({ ...formData, perkHousing: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">{formT.optHousing}</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkSalary}
                            onChange={(e) => setFormData({ ...formData, perkSalary: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">{formT.optSalary}</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkJob}
                            onChange={(e) => setFormData({ ...formData, perkJob: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">{formT.optJob}</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkStudies}
                            onChange={(e) => setFormData({ ...formData, perkStudies: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">{formT.optStudies}</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkTravel}
                            onChange={(e) => setFormData({ ...formData, perkTravel: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">{formT.optTravel}</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.perkEquipment}
                            onChange={(e) => setFormData({ ...formData, perkEquipment: e.target.checked })}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                          />
                          <span className="font-medium text-zinc-800">{formT.optEquipment}</span>
                        </label>
                      </div>
                    )}

                    {/* Team Spoken Languages */}
                    <div className="pt-3">
                      <SpokenLanguagesPicker
                        selectedLanguages={formData.spokenLanguages}
                        onChange={(langs) => setFormData({ ...formData, spokenLanguages: langs })}
                        label={formT.spokenLanguagesTitle}
                        subtitle={formT.spokenLanguagesSubtitle}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Contact & Submission */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 shadow-xs">
                  <div className="pb-3 border-b border-zinc-100 mb-5">
                    <h2 className="text-base font-bold text-zinc-950">{formT.step4Title}</h2>
                    <p className="text-xs text-zinc-500">{formT.step4Subtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formT.contactName} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="e.g. Anders Johansson"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formT.contactRole} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactRole}
                        onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                        placeholder={formT.contactRolePlaceholder}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formT.contactEmail} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="sportchef@klubb.se"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        {formT.contactPhone}
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+46 70 123 45 67"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-zinc-100">
                    <GdprConsentCheckbox
                      checked={formData.consent}
                      onChange={(checked) => setFormData({ ...formData, consent: checked })}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{isSubmitting ? "Publicerar..." : formT.submitBtn}</span>
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
