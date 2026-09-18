"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModal } from "@/components/ContactModal";
import { BookmarkButton } from "@/components/BookmarkButton";
import SocialLinks from "@/components/SocialLinks";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";
import { OccupationPreference, PlayerGrip, PlayerProfile, PlayerStatus, PositionCategory } from "@/types";
import { SupabasePlayerRow, transformSupabasePlayer } from "@/lib/dataMappers";
import { getCountry, getLanguageName } from "@/data/countries";
import { getLeagueDisplayName } from "@/lib/leagues";
import { formatWish } from "@/lib/formatters";
import { PlayerFilters } from "@/components/PlayerFilters";
import { BandyNetworkStats } from "@/components/BandyNetworkStats";

function PlayersContent() {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();

  const [playersList, setPlayersList] = useState<PlayerProfile[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedNationality, setSelectedNationality] = useState<string>("all");
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [selectedTargetCountry, setSelectedTargetCountry] = useState<string>("all");
  const [selectedCivilSetup, setSelectedCivilSetup] = useState<string>("all");
  const [selectedGrip, setSelectedGrip] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedNationalTeamOnly, setSelectedNationalTeamOnly] = useState<boolean>(false);
  const [selectedHeritageCountry, setSelectedHeritageCountry] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL search parameters with state on mount or when searchParams change
  useEffect(() => {
    const countryParam = searchParams.get("country") || searchParams.get("nationality");
    if (countryParam) {
      setSelectedNationality(countryParam.toUpperCase());
    }

    const leagueParam = searchParams.get("league");
    if (leagueParam) {
      setSelectedLeague(leagueParam);
    }

    const posParam = searchParams.get("position") || searchParams.get("pos");
    if (posParam) {
      setSelectedPosition(posParam);
    }

    const statusParam = searchParams.get("status");
    const filterParam = searchParams.get("filter");
    if (filterParam === "tryout" || statusParam === "tryout" || statusParam === "open_for_trials") {
      setSelectedStatus("open_for_trials");
    } else if (statusParam) {
      setSelectedStatus(statusParam);
    }

    const qParam = searchParams.get("search") || searchParams.get("q");
    if (qParam) {
      setSearchQuery(qParam);
    }

    const civilParam = searchParams.get("civil");
    if (civilParam) {
      setSelectedCivilSetup(civilParam);
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
    type: "player",
  });

  // Fetch players directly from Supabase
  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoadingDb(true);
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase fetch error for players:", error);
          setPlayersList([]);
          return;
        }

        if (data && data.length > 0) {
          const transformed: PlayerProfile[] = (data as SupabasePlayerRow[]).map(transformSupabasePlayer);
          setPlayersList(transformed);
        } else {
          setPlayersList([]);
        }
      } catch (err) {
        console.error("Failed to load players from Supabase:", err);
        setPlayersList([]);
      } finally {
        setLoadingDb(false);
      }
    }

    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return playersList.filter((player) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        player.name.toLowerCase().includes(query) ||
        player.previousClub.toLowerCase().includes(query) ||
        (player.countryName[lang] || player.countryName.en).toLowerCase().includes(query) ||
        (player.positionName[lang] || player.positionName.en).toLowerCase().includes(query) ||
        (player.heritageCountry && player.heritageCountry.toLowerCase().includes(query)) ||
        (player.skills[lang] || player.skills.en || []).some((s) => s.toLowerCase().includes(query)) ||
        (player.spokenLanguages && player.spokenLanguages.some((sl) => sl.toLowerCase().includes(query)));

      // 2. Position
      const matchesPos =
        selectedPosition === "all" || player.positionCategory === (selectedPosition as PositionCategory);

      // 3. Primary Nationality Filter
      const matchesNation =
        selectedNationality === "all" ||
        player.countryCode.toLowerCase() === selectedNationality.toLowerCase();

      // 3b. League / Division Filter
      const matchesLeague =
        selectedLeague === "all" ||
        player.previousClub.toLowerCase().includes(selectedLeague.toLowerCase()) ||
        player.previousClub.toLowerCase().includes(getLeagueDisplayName(selectedLeague, lang).toLowerCase());

      // 4. Target Destination Country Filter
      let matchesTargetCountry = true;
      if (selectedTargetCountry !== "all") {
        if (selectedTargetCountry === "worldwide") {
          matchesTargetCountry = Boolean(player.targetCountries?.includes("ALL"));
        } else {
          const codeUpper = selectedTargetCountry.toUpperCase();
          const isWorldwide = player.targetCountries?.includes("ALL");
          const inTargetList = player.targetCountries?.includes(codeUpper);
          const isNative = !player.targetCountries?.length && player.countryCode.toUpperCase() === codeUpper;
          matchesTargetCountry = Boolean(isWorldwide || inTargetList || isNative);
        }
      }

      // 5. Civil Profile & Setup Filter
      let matchesCivil = true;
      if (selectedCivilSetup !== "all") {
        matchesCivil = Boolean(
          player.occupationPreferences?.includes(selectedCivilSetup as OccupationPreference)
        );
      }

      // 6. Grip Filter
      const matchesGrip =
        selectedGrip === "all" || player.grip === (selectedGrip as PlayerGrip);

      // 7. Status Filter
      const matchesStatus =
        selectedStatus === "all" || player.currentStatus === (selectedStatus as PlayerStatus);

      // 8. National Team Filter
      const matchesNationalTeam =
        !selectedNationalTeamOnly || Boolean(player.openForNationalTeam);

      // 9. Heritage & Dual Citizenship Filter
      let matchesHeritage = true;
      if (selectedHeritageCountry !== "all") {
        const hUpper = selectedHeritageCountry.toUpperCase();
        const hasPrimary = player.countryCode.toUpperCase() === hUpper;
        const hasSecondary = Boolean(player.secondaryCitizenships?.some((c) => c.toUpperCase() === hUpper));
        const hasHeritageText = Boolean(player.heritageCountry && player.heritageCountry.toUpperCase().includes(hUpper));
        matchesHeritage = hasPrimary || hasSecondary || hasHeritageText;
      }

      return (
        matchesSearch &&
        matchesPos &&
        matchesNation &&
        matchesLeague &&
        matchesTargetCountry &&
        matchesCivil &&
        matchesGrip &&
        matchesStatus &&
        matchesNationalTeam &&
        matchesHeritage
      );
    });
  }, [
    playersList,
    searchQuery,
    selectedPosition,
    selectedNationality,
    selectedLeague,
    selectedTargetCountry,
    selectedCivilSetup,
    selectedGrip,
    selectedStatus,
    selectedNationalTeamOnly,
    selectedHeritageCountry,
    lang,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== "") count++;
    if (selectedPosition !== "all") count++;
    if (selectedNationality !== "all") count++;
    if (selectedLeague !== "all") count++;
    if (selectedTargetCountry !== "all") count++;
    if (selectedCivilSetup !== "all") count++;
    if (selectedGrip !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedNationalTeamOnly) count++;
    if (selectedHeritageCountry !== "all") count++;
    return count;
  }, [
    searchQuery,
    selectedPosition,
    selectedNationality,
    selectedLeague,
    selectedTargetCountry,
    selectedCivilSetup,
    selectedGrip,
    selectedStatus,
    selectedNationalTeamOnly,
    selectedHeritageCountry,
  ]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedPosition("all");
    setSelectedNationality("all");
    setSelectedLeague("all");
    setSelectedTargetCountry("all");
    setSelectedCivilSetup("all");
    setSelectedGrip("all");
    setSelectedStatus("all");
    setSelectedNationalTeamOnly(false);
    setSelectedHeritageCountry("all");
  };

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
                  {t.playersPage.badge}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                  {t.playersPage.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
                  {t.playersPage.subtitle}
                </p>
              </div>

              <Link
                href="/join"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                + {t.nav.join}
              </Link>
            </div>
          </div>
        </section>

        {/* Content & Filter Section */}
        <section className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Bandy Network Stats Banner */}
            <BandyNetworkStats players={playersList} lang={lang} />

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
                  aria-controls="mobile-player-filters"
                >
                  <div className="flex items-center gap-2">
                    <span>{showFilters ? "Hide filters ✕" : "Filter prospects ⚙️"}</span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] font-normal ${showFilters || activeFilterCount > 0 ? "text-slate-300" : "text-slate-500"}`}>
                    {filteredPlayers.length} matches
                  </span>
                </button>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-950 text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                    title={t.playersPage.clearFilters}
                  >
                    Clear ✕
                  </button>
                )}
              </div>

              {/* Collapsible Mobile Filter Drawer / Accordion */}
              {showFilters && (
                <div id="mobile-player-filters" className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <PlayerFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedPosition={selectedPosition}
                    setSelectedPosition={setSelectedPosition}
                    selectedNationality={selectedNationality}
                    setSelectedNationality={setSelectedNationality}
                    selectedLeague={selectedLeague}
                    setSelectedLeague={setSelectedLeague}
                    selectedTargetCountry={selectedTargetCountry}
                    setSelectedTargetCountry={setSelectedTargetCountry}
                    selectedCivilSetup={selectedCivilSetup}
                    setSelectedCivilSetup={setSelectedCivilSetup}
                    selectedGrip={selectedGrip}
                    setSelectedGrip={setSelectedGrip}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    selectedNationalTeamOnly={selectedNationalTeamOnly}
                    setSelectedNationalTeamOnly={setSelectedNationalTeamOnly}
                    selectedHeritageCountry={selectedHeritageCountry}
                    setSelectedHeritageCountry={setSelectedHeritageCountry}
                    activeFilterCount={activeFilterCount}
                    handleResetFilters={handleResetFilters}
                    totalMatches={filteredPlayers.length}
                    isMobile={true}
                    onCloseMobile={() => setShowFilters(false)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Desktop Left Column: Filter Sidebar Panel */}
              <aside className="hidden lg:block w-80 shrink-0 sticky top-24">
                <PlayerFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedPosition={selectedPosition}
                  setSelectedPosition={setSelectedPosition}
                  selectedNationality={selectedNationality}
                  setSelectedNationality={setSelectedNationality}
                  selectedLeague={selectedLeague}
                  setSelectedLeague={setSelectedLeague}
                  selectedTargetCountry={selectedTargetCountry}
                  setSelectedTargetCountry={setSelectedTargetCountry}
                  selectedCivilSetup={selectedCivilSetup}
                  setSelectedCivilSetup={setSelectedCivilSetup}
                  selectedGrip={selectedGrip}
                  setSelectedGrip={setSelectedGrip}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  selectedNationalTeamOnly={selectedNationalTeamOnly}
                  setSelectedNationalTeamOnly={setSelectedNationalTeamOnly}
                  selectedHeritageCountry={selectedHeritageCountry}
                  setSelectedHeritageCountry={setSelectedHeritageCountry}
                  activeFilterCount={activeFilterCount}
                  handleResetFilters={handleResetFilters}
                  totalMatches={filteredPlayers.length}
                  isMobile={false}
                />
              </aside>

              {/* Right Column: Player Results */}
              <div className="flex-1 w-full min-w-0">
                {/* Result header & View Toggle */}
                <div className="flex items-center justify-between mb-5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>
                      {filteredPlayers.length} {t.playersPage.matchesFound}
                    </span>
                    {!loadingDb && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        ● Live Sync
                      </span>
                    )}
                  </span>

                  {/* Grid vs Table View Mode */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                        viewMode === "cards" ? "bg-white text-slate-950 font-bold shadow-xs" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                        viewMode === "table" ? "bg-white text-slate-950 font-bold shadow-xs" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loadingDb && (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-xs text-slate-500 shadow-sm">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <span>Loading prospects...</span>
                  </div>
                )}

                {/* Cards View */}
                {!loadingDb && viewMode === "cards" && filteredPlayers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex flex-col justify-between bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 sm:p-6 group"
                      >
                        <div>
                          {/* Top row: Avatar, Name, Age, Country & Status */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-slate-200 relative">
                                {player.photoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={player.photoUrl}
                                    alt={player.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{player.avatarInitials}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    href={`/players/${player.id}`}
                                    className="text-lg font-bold text-slate-900 hover:underline group-hover:text-slate-800"
                                  >
                                    {player.name}
                                  </Link>
                                  {player.verified && (
                                    <span title={t.playersPage.verifiedBadge} className="text-sky-600">
                                      <svg className="w-4 h-4 inline" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span>{player.countryFlag}</span>
                                  <span>
                                    {player.countryName[lang] || player.countryName.en} • {player.age} {t.playersPage.ageLabel}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded border ${
                                  player.currentStatus === "available_free_agent" || player.currentStatus === "open_for_trials"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}>
                                  {player.statusLabel[lang] || player.statusLabel.en}
                                </span>
                                <BookmarkButton playerId={player.id} playerName={player.name} size="sm" />
                              </div>
                              {(player.packagePreference || player.packagePreferenceLabel) && (
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-sky-50 text-sky-700 border border-sky-200">
                                  {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang] || player.packagePreferenceLabel?.en}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Athletic Specs Strip */}
                          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 text-center mb-4">
                            <div>
                              <span className="text-xs text-slate-500 uppercase font-semibold block tracking-wider">
                                {t.playersPage.positionFilter}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {player.positionName[lang] || player.positionName.en}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase font-semibold block tracking-wider">
                                {t.playersPage.gripFilter}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {player.gripName[lang] || player.gripName.en}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase font-semibold block tracking-wider">
                                {t.playersPage.prevClubLabel}
                              </span>
                              <span className="font-bold text-slate-900 text-sm truncate block">
                                {player.previousClub}
                              </span>
                            </div>
                          </div>

                          {/* Geographic Mobility & Civil Profile Badges */}
                          <div className="mb-4 p-3 bg-slate-50/60 rounded-lg border border-slate-200/80 text-xs space-y-2">
                            {/* Target Countries */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
                                {t.playersPage.openInCountriesLabel}:
                              </span>
                              {player.targetCountries?.includes("ALL") ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs">
                                  🌍 Worldwide
                                </span>
                              ) : player.targetCountries && player.targetCountries.length > 0 ? (
                                player.targetCountries.map((code) => {
                                  const c = getCountry(code);
                                  return (
                                    <span
                                      key={code}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-xs font-medium"
                                    >
                                      <span>{c?.flag || "🏳️"}</span>
                                      <span>{c ? (c.names[lang] || c.names.en) : code}</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-slate-600 text-xs">{player.countryName[lang] || player.countryName.en}</span>
                              )}
                            </div>

                            {/* National Team & Heritage Info */}
                            {(player.openForNationalTeam || (player.secondaryCitizenships && player.secondaryCitizenships.length > 0) || player.heritageCountry) && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-200/60 text-xs">
                                {player.openForNationalTeam && (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs">
                                    🌍 Open for National Team
                                  </span>
                                )}
                                {player.secondaryCitizenships?.map((code) => {
                                  const c = getCountry(code);
                                  return (
                                    <span key={code} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 font-medium text-xs">
                                      🛂 {c?.flag || ""} {c ? (c.names[lang] || c.names.en) : code}
                                    </span>
                                  );
                                })}
                                {player.heritageCountry && (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium text-xs truncate max-w-[200px]" title={player.heritageCountry}>
                                    🧬 {player.heritageCountry}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Civil / Career Preferences */}
                            {player.occupationPreferences && player.occupationPreferences.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap pt-1.5 border-t border-slate-200/60">
                                {player.occupationPreferences.includes("studies") && (
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
                                    🎓 {t.occupationPreferences.studies}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("fulltime_job") && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                                    💼 {t.occupationPreferences.fulltime_job}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("parttime_job") && (
                                  <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium">
                                    🕒 {t.occupationPreferences.parttime_job}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("housing") && (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                                    🏠 {t.occupationPreferences.housing}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("sports_only") && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                                    🏒 {t.occupationPreferences.sports_only}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Spoken Languages */}
                            {player.spokenLanguages && player.spokenLanguages.length > 0 && (
                              <div className="flex items-center gap-1 pt-1.5 border-t border-slate-200/60 text-xs text-slate-600">
                                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                                  {t.playersPage.spokenLanguagesLabel}:
                                </span>
                                <span className="font-medium text-slate-800">
                                  {player.spokenLanguages.map((code) => getLanguageName(code, lang)).join(", ")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Key Attributes Tags (Only if defined) */}
                          {(player.skills[lang] || player.skills.en) && (player.skills[lang] || player.skills.en).length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                {t.playersPage.skillsLabel}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(player.skills[lang] || player.skills.en).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bio Snippet */}
                          <p className="text-base text-slate-600 line-clamp-2 leading-relaxed mb-3">
                            {player.bio[lang] || player.bio.en}
                          </p>

                          {/* Social media links if available */}
                          <SocialLinks
                            instagramUrl={player.instagramUrl}
                            youtubeUrl={player.youtubeUrl}
                            tiktokUrl={player.tiktokUrl}
                          />
                        </div>

                        {/* Card CTA Footer */}
                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                          <Link
                            href={`/players/${player.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-slate-700 underline"
                          >
                            {t.playersPage.viewProfileBtn} →
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setContactModal({
                                isOpen: true,
                                targetName: player.name,
                                targetEmail: player.email,
                                targetId: player.id,
                                type: "player",
                              })
                            }
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-sm"
                          >
                            {t.playersPage.contactBtn}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Table View */}
                {!loadingDb && viewMode === "table" && filteredPlayers.length > 0 && (
                  <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4 font-bold">Player</th>
                            <th className="py-3 px-4 font-bold">Pos</th>
                            <th className="py-3 px-4 font-bold">Age</th>
                            <th className="py-3 px-4 font-bold">Nation</th>
                            <th className="py-3 px-4 font-bold">Club</th>
                            <th className="py-3 px-4 font-bold">Status & Level</th>
                            <th className="py-3 px-4 font-bold">National Team</th>
                            <th className="py-3 px-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {filteredPlayers.map((player) => (
                            <tr key={player.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-950 whitespace-nowrap">
                                <Link href={`/players/${player.id}`} className="hover:underline flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center overflow-hidden shrink-0">
                                    {player.photoUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{player.avatarInitials}</span>
                                    )}
                                  </div>
                                  <span>{player.name}</span>
                                  {player.verified && (
                                    <span className="text-slate-900 text-[10px]">✓</span>
                                  )}
                                </Link>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-medium">
                                {player.positionName[lang] || player.positionName.en}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                {player.age}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="mr-1">{player.countryFlag}</span>
                                <span>{player.countryName[lang] || player.countryName.en}</span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                {player.previousClub}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                                    player.currentStatus === "available_free_agent" || player.currentStatus === "open_for_trials"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}>
                                    {player.statusLabel[lang] || player.statusLabel.en}
                                  </span>
                                  {(player.packagePreference || player.packagePreferenceLabel) && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">
                                      {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang] || player.packagePreferenceLabel?.en}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {player.openForNationalTeam ? (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-semibold">
                                    🌍 Open
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                                <BookmarkButton playerId={player.id} playerName={player.name} size="sm" />
                                <Link
                                  href={`/players/${player.id}`}
                                  className="font-semibold text-slate-900 hover:underline"
                                >
                                  Profile
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!loadingDb && filteredPlayers.length === 0 && (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400 text-xl font-bold">
                      ∅
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      No players match your filters
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                      Try adjusting your search criteria or register a player profile for free.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {t.search.resetBtn}
                      </button>
                      <Link
                        href="/join"
                        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {t.nav.join}
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

export default function PlayersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
          Loading prospects...
        </div>
      }
    >
      <PlayersContent />
    </Suspense>
  );
}
