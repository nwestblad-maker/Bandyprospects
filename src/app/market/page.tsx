"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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

export default function MarketPage() {
  const { lang, t } = useLanguage();

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
      const matchesSearch =
        query === "" ||
        ad.club.toLowerCase().includes(query) ||
        ad.city.toLowerCase().includes(query) ||
        ad.positionName[lang].toLowerCase().includes(query) ||
        ad.divisionName[lang].toLowerCase().includes(query) ||
        ad.countryName[lang].toLowerCase().includes(query) ||
        (ad.tournament && ad.tournament.toLowerCase().includes(query)) ||
        (ad.rolesDescription && ad.rolesDescription[lang]?.toLowerCase().includes(query));

      // 2. Country Filter
      const matchesCountry =
        selectedCountry === "all" ||
        ad.countryCode.toUpperCase() === selectedCountry.toUpperCase();

      // 3. League / Division Filter
      const matchesLeague =
        selectedLeague === "all" ||
        ad.divisionCategory === selectedLeague ||
        (ad.divisionName && (
          ad.divisionName[lang]?.toLowerCase().includes(selectedLeague.toLowerCase()) ||
          ad.divisionName[lang]?.toLowerCase().includes(getLeagueDisplayName(selectedLeague, lang).toLowerCase())
        ));

      // 4. Role / Position Filter (Matches if multi-positions contains role OR single role matches)
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header />

      <main className="flex-1">
        {/* Ingress Header */}
        <section className="bg-white border-b border-zinc-200 py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                  {t.marketPage.badge}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                  {t.marketPage.title}
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-2xl leading-relaxed">
                  {t.marketPage.subtitle}
                </p>
              </div>

              <Link
                href="/post-ad"
                className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.marketPage.postOpportunityBtn}
              </Link>
            </div>

            {/* Quick Segment Tabs: All vs Clubs vs National Teams */}
            <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrgType("all")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedOrgType === "all"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-200"
                }`}
              >
                <span>🌐 {lang === "sv" ? "Alla efterlysningar" : "All Postings"}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedOrgType === "all" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"}`}>
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrgType("club")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedOrgType === "club"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-200"
                }`}
              >
                <span>🏟️ {lang === "sv" ? "Klubblag" : "Club Teams"}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedOrgType === "club" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"}`}>
                  {counts.clubs}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrgType("national_team")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedOrgType === "national_team"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-200"
                }`}
              >
                <span>🌍 {lang === "sv" ? "Landslagsefterlysningar (National Team Hub)" : "National Team Hub"}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${selectedOrgType === "national_team" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"}`}>
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
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50"
                  }`}
                  aria-expanded={showFilters}
                  aria-controls="mobile-club-filters"
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {showFilters
                        ? (lang === "sv" ? "Dölj filter ✕" : "Hide filters ✕")
                        : (lang === "sv" ? "Filtrera annonser ⚙️" : "Filter postings ⚙️")}
                    </span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-zinc-950 text-[11px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] font-normal ${showFilters || activeFilterCount > 0 ? "text-zinc-300" : "text-zinc-500"}`}>
                    {filteredClubAds.length} {lang === "sv" ? "träffar" : "matches"}
                  </span>
                </button>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                    title={t.marketPage.clearFilters}
                  >
                    {lang === "sv" ? "Rensa ✕" : "Clear ✕"}
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
              {/* Desktop Left Column: Filter Sidebar Panel (Always open & sticky beside ad cards) */}
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
                <div className="flex items-center justify-between mb-5 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-800 flex items-center gap-2">
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
                  <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-xs text-zinc-500">
                    <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <span>{lang === "sv" ? "Laddar efterlysningar..." : "Loading postings..."}</span>
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
                          className="flex flex-col justify-between bg-white border border-zinc-200 hover:border-zinc-400 rounded-xl p-5 sm:p-6 transition-all shadow-xs group"
                        >
                          <div>
                            {/* Top Line: Flag, City, Urgent & Category & Badge */}
                            <div className="flex items-start justify-between gap-2 text-xs text-zinc-500 mb-3 flex-wrap">
                              <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                                <span className="text-base">{ad.countryFlag}</span>
                                <span className="font-semibold text-zinc-900">
                                  {ad.city}, {ad.countryCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {isNationalTeam && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center gap-1">
                                    <span>🌍</span>
                                    <span>National Team</span>
                                  </span>
                                )}
                                {ad.urgent && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-50 text-rose-700 border border-rose-200">
                                    {t.marketPage.urgentTag}
                                  </span>
                                )}
                                {ad.teamCategory && ad.teamCategory !== "men" && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                                    {teamCategoryLabels[ad.teamCategory]}
                                  </span>
                                )}
                                {!isNationalTeam && (
                                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                                    {ad.divisionName[lang]}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Club / National Team Title */}
                            <div className="mb-2">
                              <h3 className="text-lg font-bold text-zinc-950 group-hover:text-zinc-800 transition-colors">
                                {ad.club}
                              </h3>
                              {isNationalTeam && ad.tournament && (
                                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mt-1">
                                  <span>🏆</span>
                                  <span>{ad.tournament}</span>
                                </div>
                              )}
                            </div>

                            {/* Multi-Positions Badges */}
                            <div className="mb-3 mt-2">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                                {t.marketPage.soughtPositionsLabel}:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {positionsToRender.map((pos) => (
                                  <span
                                    key={pos}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 text-white text-xs font-semibold shadow-2xs"
                                  >
                                    <span>{pos === "goalkeeper" ? "🧤" : pos === "defender" ? "🛡️" : pos === "halv" ? "⚡" : pos === "midfielder" ? "🎯" : "🏒"}</span>
                                    <span>{positionLabels[pos] || pos}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* FIB Eligibility Requirements Tags */}
                            {isNationalTeam && ad.eligibilityRequirements && ad.eligibilityRequirements.length > 0 && (
                              <div className="mb-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                  {lang === "sv" ? "Behörighetskrav (Eligibility)" : "Eligibility Requirements"}:
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {ad.eligibilityRequirements.map((req, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-zinc-800 font-medium text-[11px] border border-zinc-200"
                                    >
                                      <span>{req.includes("Passport") ? "🛂" : req.includes("Heritage") ? "🧬" : "🌐"}</span>
                                      <span>{req}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Optional Roles Description */}
                            {ad.rolesDescription && ad.rolesDescription[lang] && (
                              <div className="mb-3 text-xs font-medium text-zinc-700 bg-zinc-50/80 p-2.5 rounded-lg border border-zinc-200/70 italic break-words">
                                &ldquo;{ad.rolesDescription[lang]}&rdquo;
                              </div>
                            )}

                            {/* Main Description */}
                            <p className="text-xs text-zinc-600 leading-relaxed mb-4 break-words">
                              {ad.description[lang]}
                            </p>

                            {/* Spoken Languages in Team */}
                            {ad.spokenLanguages && ad.spokenLanguages.length > 0 && (
                              <div className="mb-4 flex items-center gap-2 flex-wrap text-xs text-zinc-500">
                                <span className="font-semibold text-zinc-700">
                                  {t.marketPage.teamLanguagesLabel}:
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {ad.spokenLanguages.map((code) => (
                                    <span
                                      key={code}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200"
                                    >
                                      <span>{getLanguageFlag(code)}</span>
                                      <span>{getLanguageName(code, lang)}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Benefits / Offer Tags */}
                            <div className="border-t border-zinc-100 pt-3 mb-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                                {t.marketPage.offeredPackageTitle}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {ad.perks[lang].map((perk, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 text-[11px] font-medium"
                                  >
                                    ✓ {perk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Contact details and Apply button */}
                          <div className="border-t border-zinc-100 pt-4 mt-2 flex items-center justify-between gap-3">
                            <div className="text-xs min-w-0 flex-1">
                              <span className="text-zinc-400 block text-[10px]">
                                {t.marketPage.contactPersonLabel}
                              </span>
                              <span className="font-semibold text-zinc-900 block truncate">
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
                              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
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
                  <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400 text-xl font-bold">
                      ∅
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 mb-1">
                      {lang === "sv"
                        ? "Inga aktiva efterlysningar matchar dina filter"
                        : "No active postings match your filters"}
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                      {lang === "sv"
                        ? "Testa att nollställa dina sökkriterier eller lägg upp en efterlysning för ditt lag."
                        : "Try resetting your search criteria or create a posting for your team."}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {t.search.resetBtn}
                      </button>
                      <Link
                        href="/post-ad"
                        className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
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
