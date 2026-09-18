"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClubAdFilters } from "@/components/ClubAdFilters";
import { ContactModal } from "@/components/ContactModal";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { ClubAd, OrgType, PerkCategory, PositionCategory, TeamCategory } from "@/types";
import { SupabaseClubAdRow, transformSupabaseClubAd } from "@/lib/dataMappers";
import { getLeagueDisplayName } from "@/lib/leagues";
import { getLanguageFlag, getLanguageName } from "@/data/countries";

function MarketContent() {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();

  const [clubAdsList, setClubAdsList] = useState<ClubAd[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Filters state
  const [selectedOrgType, setSelectedOrgType] = useState<"all" | "club" | "national_team">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedTeamCategory, setSelectedTeamCategory] = useState<string>("all");
  const [selectedPerk, setSelectedPerk] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL search parameters with state on mount or when searchParams change
  useEffect(() => {
    const countryParam = searchParams.get("country");
    if (countryParam) {
      setSelectedCountry(countryParam.toUpperCase());
    }

    const leagueParam = searchParams.get("league");
    if (leagueParam) {
      setSelectedLeague(leagueParam);
    }

    const roleParam = searchParams.get("role") || searchParams.get("position");
    if (roleParam) {
      setSelectedRole(roleParam);
    }

    const filterParam = searchParams.get("filter");
    if (filterParam === "tryout") {
      setSearchQuery("tryout");
    }

    const qParam = searchParams.get("search") || searchParams.get("q");
    if (qParam) {
      setSearchQuery(qParam);
    }

    const orgParam = searchParams.get("orgType") || searchParams.get("org");
    if (orgParam && (orgParam === "club" || orgParam === "national_team" || orgParam === "all")) {
      setSelectedOrgType(orgParam);
    }
  }, [searchParams]);

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

  // Fetch real club ads strictly from Supabase
  useEffect(() => {
    async function loadClubAds() {
      try {
        setLoadingDb(true);
        const { data, error } = await supabase
          .from("club_ads")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase fetch error for club_ads:", error);
          setClubAdsList([]);
          return;
        }

        if (data && data.length > 0) {
          const transformed: ClubAd[] = (data as SupabaseClubAdRow[]).map(transformSupabaseClubAd);
          setClubAdsList(transformed);
        } else {
          setClubAdsList([]);
        }
      } catch (err) {
        console.error("Failed to load club ads from Supabase:", err);
        setClubAdsList([]);
      } finally {
        setLoadingDb(false);
      }
    }

    loadClubAds();
  }, []);

  // Filter ads
  const filteredClubAds = useMemo(() => {
    return clubAdsList.filter((ad) => {
      // 0. Org Type Filter
      const matchesOrgType =
        selectedOrgType === "all" || (ad.orgType || "club") === selectedOrgType;

      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const isTryoutSearch = query === "tryout" || query === "provspel";
      const matchesSearch =
        query === "" ||
        ad.club.toLowerCase().includes(query) ||
        ad.city.toLowerCase().includes(query) ||
        (ad.positionName[lang] || ad.positionName.en).toLowerCase().includes(query) ||
        (ad.divisionName[lang] || ad.divisionName.en).toLowerCase().includes(query) ||
        (ad.countryName[lang] || ad.countryName.en).toLowerCase().includes(query) ||
        (ad.tournament && ad.tournament.toLowerCase().includes(query)) ||
        (ad.rolesDescription && (
          (ad.rolesDescription[lang] || ad.rolesDescription.en || "").toLowerCase().includes(query) ||
          (isTryoutSearch && (
            (ad.rolesDescription[lang] || ad.rolesDescription.en || "").toLowerCase().includes("provspel") ||
            (ad.rolesDescription[lang] || ad.rolesDescription.en || "").toLowerCase().includes("tryout")
          ))
        )) ||
        (ad.description && (
          (ad.description[lang] || ad.description.en || "").toLowerCase().includes(query) ||
          (isTryoutSearch && (
            (ad.description[lang] || ad.description.en || "").toLowerCase().includes("provspel") ||
            (ad.description[lang] || ad.description.en || "").toLowerCase().includes("tryout")
          ))
        ));

      // 2. Country Filter
      const matchesCountry =
        selectedCountry === "all" ||
        ad.countryCode.toUpperCase() === selectedCountry.toUpperCase();

      // 3. League / Division Filter
      const matchesLeague =
        selectedLeague === "all" ||
        ad.divisionCategory === selectedLeague ||
        (ad.divisionName && (
          (ad.divisionName[lang] || ad.divisionName.en || "").toLowerCase().includes(selectedLeague.toLowerCase()) ||
          (ad.divisionName[lang] || ad.divisionName.en || "").toLowerCase().includes(getLeagueDisplayName(selectedLeague, lang).toLowerCase())
        ));

      // 4. Role / Position Filter
      const matchesRole =
        selectedRole === "all" ||
        (ad.positions && ad.positions.includes(selectedRole as PositionCategory)) ||
        ad.positionCategory === (selectedRole as PositionCategory);

      // 5. Team Category Filter
      const matchesTeamCategory =
        selectedTeamCategory === "all" ||
        (ad.teamCategory || "men") === selectedTeamCategory;

      // 6. Perk Filter
      const matchesPerk =
        selectedPerk === "all" || ad.perkCategories.includes(selectedPerk as PerkCategory);

      return (
        matchesOrgType &&
        matchesSearch &&
        matchesCountry &&
        matchesLeague &&
        matchesRole &&
        matchesTeamCategory &&
        matchesPerk
      );
    });
  }, [
    clubAdsList,
    selectedOrgType,
    searchQuery,
    selectedCountry,
    selectedLeague,
    selectedRole,
    selectedTeamCategory,
    selectedPerk,
    lang,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedOrgType !== "all") count++;
    if (searchQuery.trim() !== "") count++;
    if (selectedCountry !== "all") count++;
    if (selectedLeague !== "all") count++;
    if (selectedRole !== "all") count++;
    if (selectedTeamCategory !== "all") count++;
    if (selectedPerk !== "all") count++;
    return count;
  }, [
    selectedOrgType,
    searchQuery,
    selectedCountry,
    selectedLeague,
    selectedRole,
    selectedTeamCategory,
    selectedPerk,
  ]);

  const handleResetFilters = () => {
    setSelectedOrgType("all");
    setSearchQuery("");
    setSelectedCountry("all");
    setSelectedLeague("all");
    setSelectedRole("all");
    setSelectedTeamCategory("all");
    setSelectedPerk("all");
  };

  const positionLabels: Record<string, string> = {
    goalkeeper: t.positions.goalkeeper,
    defender: t.positions.defender,
    halv: t.positions.halv,
    midfielder: t.positions.midfielder,
    forward: t.positions.forward,
  };

  const teamCategoryLabels: Record<TeamCategory, string> = {
    men: t.marketPage.teamTypeMen,
    women: t.marketPage.teamTypeWomen,
    junior: t.marketPage.teamTypeJunior,
  };

  const counts = useMemo(() => {
    const clubs = clubAdsList.filter((a) => (a.orgType || "club") === "club").length;
    const nationalTeams = clubAdsList.filter((a) => a.orgType === "national_team").length;
    return { all: clubAdsList.length, clubs, nationalTeams };
  }, [clubAdsList]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-slate-50">
      <Header />

      <main className="flex-1">
        {/* Ingress Header */}
        <section className="bg-white border-b border-slate-200/80 py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  {t.marketPage.badge}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                  {t.marketPage.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
                  {t.marketPage.subtitle}
                </p>
              </div>

              <Link
                href="/post-ad"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.marketPage.postOpportunityBtn}
              </Link>
            </div>

            {/* Quick Segment Tabs: All vs Clubs vs National Teams */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrgType("all")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedOrgType === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200"
                }`}
              >
                <span>🌐 All Postings</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedOrgType === "all" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"}`}>
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrgType("club")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedOrgType === "club"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200"
                }`}
              >
                <span>🏟️ Club Teams</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedOrgType === "club" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"}`}>
                  {counts.clubs}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrgType("national_team")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedOrgType === "national_team"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200"
                }`}
              >
                <span>🌍 National Team Hub</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedOrgType === "national_team" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"}`}>
                  {counts.nationalTeams}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Content & Filter Section */}
        <section className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile Filter Toggle & Compact Button Bar (< lg) */}
            <div className="lg:hidden mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    showFilters || activeFilterCount > 0
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
                  }`}
                  aria-expanded={showFilters}
                  aria-controls="mobile-club-filters"
                >
                  <div className="flex items-center gap-2">
                    <span>{showFilters ? "Hide filters ✕" : "Filter postings ⚙️"}</span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] font-normal ${showFilters || activeFilterCount > 0 ? "text-slate-300" : "text-slate-500"}`}>
                    {filteredClubAds.length} matches
                  </span>
                </button>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-950 text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                    title={t.marketPage.clearFilters}
                  >
                    Clear ✕
                  </button>
                )}
              </div>

              {/* Collapsible Mobile Filter Drawer / Accordion */}
              {showFilters && (
                <div id="mobile-club-filters" className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <ClubAdFilters
                    selectedOrgType={selectedOrgType}
                    setSelectedOrgType={setSelectedOrgType}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    selectedLeague={selectedLeague}
                    setSelectedLeague={setSelectedLeague}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    selectedTeamCategory={selectedTeamCategory}
                    setSelectedTeamCategory={setSelectedTeamCategory}
                    selectedPerk={selectedPerk}
                    setSelectedPerk={setSelectedPerk}
                    activeFilterCount={activeFilterCount}
                    handleResetFilters={handleResetFilters}
                    totalMatches={filteredClubAds.length}
                    isMobile={true}
                    onCloseMobile={() => setShowFilters(false)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Desktop Left Column: Filter Sidebar Panel */}
              <aside className="hidden lg:block w-80 shrink-0 sticky top-24">
                <ClubAdFilters
                  selectedOrgType={selectedOrgType}
                  setSelectedOrgType={setSelectedOrgType}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCountry={selectedCountry}
                  setSelectedCountry={setSelectedCountry}
                  selectedLeague={selectedLeague}
                  setSelectedLeague={setSelectedLeague}
                  selectedRole={selectedRole}
                  setSelectedRole={setSelectedRole}
                  selectedTeamCategory={selectedTeamCategory}
                  setSelectedTeamCategory={setSelectedTeamCategory}
                  selectedPerk={selectedPerk}
                  setSelectedPerk={setSelectedPerk}
                  activeFilterCount={activeFilterCount}
                  handleResetFilters={handleResetFilters}
                  totalMatches={filteredClubAds.length}
                  isMobile={false}
                />
              </aside>

              {/* Right Column: Club Postings List */}
              <div className="flex-1 w-full min-w-0">
                {/* Result header */}
                <div className="flex items-center justify-between mb-5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>
                      {filteredClubAds.length} {t.marketPage.matchesFound}
                    </span>
                    {!loadingDb && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        ● Live Sync
                      </span>
                    )}
                  </span>
                  <span>Active Season 2026/27</span>
                </div>

                {/* Loading State */}
                {loadingDb && (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-xs text-slate-500 shadow-sm">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <span>Loading postings...</span>
                  </div>
                )}

                {/* Postings Grid */}
                {!loadingDb && filteredClubAds.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredClubAds.map((ad) => {
                      const positionsToRender = ad.positions && ad.positions.length > 0
                        ? ad.positions
                        : [ad.positionCategory];

                      const isNationalTeam = ad.orgType === "national_team";

                      return (
                        <div
                          key={ad.id}
                          className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 sm:p-6 group"
                        >
                          <div>
                            {/* Top Line: Flag, City, Urgent & Category & Badge */}
                            <div className="flex items-start justify-between gap-2 text-sm text-slate-500 mb-3 flex-wrap">
                              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <span className="text-base">{ad.countryFlag}</span>
                                <span className="font-semibold text-slate-900">
                                  {ad.city}, {ad.countryCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {isNationalTeam && (
                                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                                    <span>🌍</span>
                                    <span>National Team</span>
                                  </span>
                                )}
                                {ad.urgent && (
                                  <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-rose-50 text-rose-700 border border-rose-200">
                                    {t.marketPage.urgentTag}
                                  </span>
                                )}
                                {ad.teamCategory && ad.teamCategory !== "men" && (
                                  <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-800 border border-slate-200">
                                    {teamCategoryLabels[ad.teamCategory]}
                                  </span>
                                )}
                                {!isNationalTeam && (
                                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-sky-50 text-sky-700 border border-sky-200">
                                    {ad.divisionName[lang] || ad.divisionName.en}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Club / National Team Title */}
                            <div className="mb-2">
                              <h3 className="text-lg font-bold text-slate-950 group-hover:text-slate-800 transition-colors">
                                {ad.club}
                              </h3>
                              {isNationalTeam && ad.tournament && (
                                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-1">
                                  <span>🏆</span>
                                  <span>{ad.tournament}</span>
                                </div>
                              )}
                            </div>

                            {/* Multi-Positions Badges */}
                            <div className="mb-3 mt-2">
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                {t.marketPage.soughtPositionsLabel}:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {positionsToRender.map((pos) => (
                                  <span
                                    key={pos}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-semibold shadow-xs"
                                  >
                                    <span>{pos === "goalkeeper" ? "🧤" : pos === "defender" ? "🛡️" : pos === "halv" ? "⚡" : pos === "midfielder" ? "🎯" : "🏒"}</span>
                                    <span>{positionLabels[pos] || pos}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Eligibility Requirements Tags */}
                            {isNationalTeam && ad.eligibilityRequirements && ad.eligibilityRequirements.length > 0 && (
                              <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                  Eligibility Requirements:
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {ad.eligibilityRequirements.map((req, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-800 font-medium text-xs border border-slate-200"
                                    >
                                      <span>{req.includes("Passport") ? "🛂" : req.includes("Heritage") ? "🧬" : "🌐"}</span>
                                      <span>{req}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Optional Roles Description */}
                            {ad.rolesDescription && (ad.rolesDescription[lang] || ad.rolesDescription.en) && (
                              <div className="mb-3 text-sm font-medium text-slate-700 bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 italic break-words">
                                &ldquo;{ad.rolesDescription[lang] || ad.rolesDescription.en}&rdquo;
                              </div>
                            )}

                            {/* Main Description */}
                            <p className="text-base text-slate-600 leading-relaxed mb-4 break-words">
                              {ad.description[lang] || ad.description.en}
                            </p>

                            {/* Spoken Languages in Team */}
                            {ad.spokenLanguages && ad.spokenLanguages.length > 0 && (
                              <div className="mb-4 flex items-center gap-2 flex-wrap text-sm text-slate-500">
                                <span className="font-semibold text-slate-700">
                                  {t.marketPage.teamLanguagesLabel}:
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {ad.spokenLanguages.map((code) => (
                                    <span
                                      key={code}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                                    >
                                      <span>{getLanguageFlag(code)}</span>
                                      <span>{getLanguageName(code, lang)}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Benefits / Offer Tags */}
                            <div className="border-t border-slate-100 pt-3 mb-4">
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                {t.marketPage.offeredPackageTitle}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(ad.perks[lang] || ad.perks.en || []).map((perk, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
                                  >
                                    ✓ {perk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Contact details and Apply button */}
                          <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-slate-500 block text-xs font-medium">
                                {t.marketPage.contactPersonLabel}
                              </span>
                              <span className="font-semibold text-slate-900 block truncate text-sm">
                                {ad.contactPerson}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setContactModal({
                                  isOpen: true,
                                  targetName: ad.club,
                                  targetEmail: ad.contactEmail,
                                  targetId: ad.id,
                                  type: "club",
                                })
                              }
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
                            >
                              {t.marketPage.applyBtn} →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!loadingDb && filteredClubAds.length === 0 && (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400 text-xl font-bold">
                      ∅
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      No active postings match your filters
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                      Try resetting your search criteria or create a posting for your team.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {t.search.resetBtn}
                      </button>
                      <Link
                        href="/post-ad"
                        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {t.marketPage.postOpportunityBtn}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Direct Contact Modal */}
      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ ...contactModal, isOpen: false })}
        targetName={contactModal.targetName}
        targetEmail={contactModal.targetEmail}
        targetId={contactModal.targetId}
        type={contactModal.type}
      />

      <Footer />
    </div>
  );
}

export default function MarketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
          Loading postings...
        </div>
      }
    >
      <MarketContent />
    </Suspense>
  );
}
