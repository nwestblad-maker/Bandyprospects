"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
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

export default function PlayersPage() {
  const { lang, t } = useLanguage();

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
        player.countryName[lang].toLowerCase().includes(query) ||
        player.positionName[lang].toLowerCase().includes(query) ||
        (player.heritageCountry && player.heritageCountry.toLowerCase().includes(query)) ||
        player.skills[lang].some((s) => s.toLowerCase().includes(query)) ||
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
                  {t.playersPage.badge}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                  {t.playersPage.title}
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-2xl leading-relaxed">
                  {t.playersPage.subtitle}
                </p>
              </div>

              <Link
                href="/join"
                className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                + {t.nav.join}
              </Link>
            </div>
          </div>
        </section>

        {/* Content & Filter Section */}
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Filter Sidebar Panel */}
              <aside className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                    {t.playersPage.filtersTitle}
                  </h2>
                  {(searchQuery ||
                    selectedPosition !== "all" ||
                    selectedNationality !== "all" ||
                    selectedLeague !== "all" ||
                    selectedTargetCountry !== "all" ||
                    selectedCivilSetup !== "all" ||
                    selectedGrip !== "all" ||
                    selectedStatus !== "all" ||
                    selectedNationalTeamOnly ||
                    selectedHeritageCountry !== "all") && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 underline cursor-pointer"
                    >
                      {t.playersPage.clearFilters}
                    </button>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  {/* Search Query */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1.5">Search</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.playersPage.searchPlaceholder}
                        className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  {/* National Team & FIB Scouting Section (Dedicated Highlight) */}
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-[11px] uppercase tracking-wider">
                      <span>🌍</span>
                      <span>{lang === "sv" ? "Landslag & FIB Scouting" : "National Team Hub"}</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedNationalTeamOnly}
                        onChange={(e) => setSelectedNationalTeamOnly(e.target.checked)}
                        className="w-3.5 h-3.5 text-zinc-900 rounded border-zinc-300 focus:ring-0"
                      />
                      <span className="font-semibold text-zinc-800 text-xs">
                        {lang === "sv" ? "Öppen för landslagsspel" : "Open for National Team"}
                      </span>
                    </label>

                    <div>
                      <CountrySelect
                        label={lang === "sv" ? "Pass / Anknytning (Heritage)" : "Passport / Heritage Country"}
                        value={selectedHeritageCountry === "all" ? "" : selectedHeritageCountry}
                        onChange={(code) => setSelectedHeritageCountry(code || "all")}
                        includeAllOption={true}
                        allOptionLabel={lang === "sv" ? "Alla pass & rötter" : "All Passports & Heritage"}
                      />
                    </div>
                  </div>

                  {/* Position Filter */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1.5">
                      {t.playersPage.positionFilter}
                    </label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="all">{t.positions.all}</option>
                      <option value="goalkeeper">{t.positions.goalkeeper}</option>
                      <option value="defender">{t.positions.defender}</option>
                      <option value="halv">{t.positions.halv}</option>
                      <option value="midfielder">{t.positions.midfielder}</option>
                      <option value="forward">{t.positions.forward}</option>
                    </select>
                  </div>

                  {/* Primary Nationality Filter */}
                  <div>
                    <CountrySelect
                      label={t.playersPage.nationalityFilter}
                      value={selectedNationality === "all" ? "" : selectedNationality}
                      onChange={(code) => {
                        setSelectedNationality(code || "all");
                        setSelectedLeague("all");
                      }}
                      includeAllOption={true}
                      allOptionLabel={lang === "sv" ? "Alla nationaliteter" : "All Nationalities"}
                    />
                  </div>

                  {/* League / Division Filter */}
                  <div>
                    <LeagueSelect
                      countryCode={selectedNationality === "all" ? "SE" : selectedNationality}
                      value={selectedLeague === "all" ? "" : selectedLeague}
                      onChange={(leagueId) => setSelectedLeague(leagueId || "all")}
                      label={lang === "sv" ? "Nuvarande liga / serie" : "Current League"}
                      includeAllOption={true}
                      allOptionLabel={lang === "sv" ? "Alla ligor & serier" : "All Leagues & Series"}
                    />
                  </div>

                  {/* Target Destination Country Filter */}
                  <div>
                    <CountrySelect
                      label={t.playersPage.targetCountryFilter}
                      value={selectedTargetCountry === "all" ? "" : selectedTargetCountry}
                      onChange={(code) => setSelectedTargetCountry(code || "all")}
                      includeAllOption={true}
                      allOptionLabel={lang === "sv" ? "Alla önskade länder" : "All Target Countries"}
                    />
                  </div>

                  {/* Civil Profile / Dual-Career Setup Filter */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1.5">
                      {t.playersPage.civilProfileFilter}
                    </label>
                    <select
                      value={selectedCivilSetup}
                      onChange={(e) => setSelectedCivilSetup(e.target.value)}
                      className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="all">{t.occupationPreferences.all}</option>
                      <option value="studies">{t.occupationPreferences.studies}</option>
                      <option value="fulltime_job">{t.occupationPreferences.fulltime_job}</option>
                      <option value="parttime_job">{t.occupationPreferences.parttime_job}</option>
                      <option value="housing">{t.occupationPreferences.housing}</option>
                      <option value="sports_only">{t.occupationPreferences.sports_only}</option>
                    </select>
                  </div>

                  {/* Grip Filter */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1.5">
                      {t.playersPage.gripFilter}
                    </label>
                    <select
                      value={selectedGrip}
                      onChange={(e) => setSelectedGrip(e.target.value)}
                      className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="all">{t.grips.all}</option>
                      <option value="left">{t.grips.left}</option>
                      <option value="right">{t.grips.right}</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1.5">
                      {t.playersPage.statusFilter}
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="all">{t.statuses.all}</option>
                      <option value="available_free_agent">{t.statuses.available_free_agent}</option>
                      <option value="open_for_trials">{t.statuses.open_for_trials}</option>
                      <option value="seeking_26_27">{t.statuses.seeking_26_27}</option>
                      <option value="open_abroad">{t.statuses.open_abroad}</option>
                      <option value="contracted_transferable">{t.statuses.contracted_transferable}</option>
                    </select>
                  </div>

                  {/* Reset Filters CTA */}
                  <div className="pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="w-full py-2 px-3 text-center text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                    >
                      {t.search.resetBtn}
                    </button>
                  </div>
                </div>
              </aside>

              {/* Right Column: Player Results */}
              <div className="lg:col-span-9">
                {/* Result header & View Toggle */}
                <div className="flex items-center justify-between mb-5 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-800 flex items-center gap-2">
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
                  <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                        viewMode === "cards" ? "bg-white text-zinc-950 font-bold shadow-2xs" : "text-zinc-600 hover:text-zinc-950"
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                        viewMode === "table" ? "bg-white text-zinc-950 font-bold shadow-2xs" : "text-zinc-600 hover:text-zinc-950"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loadingDb && (
                  <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-xs text-zinc-500">
                    <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <span>{lang === "sv" ? "Laddar spelarprofiler..." : "Loading prospects..."}</span>
                  </div>
                )}

                {/* Cards View */}
                {!loadingDb && viewMode === "cards" && filteredPlayers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex flex-col justify-between bg-white border border-zinc-200 rounded-xl p-6 hover:border-zinc-400 transition-colors shadow-xs group"
                      >
                        <div>
                          {/* Top row: Avatar, Name, Age, Country & Status */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white font-bold text-sm flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-zinc-200 relative">
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
                                    className="text-base font-bold text-zinc-950 hover:underline group-hover:text-zinc-800"
                                  >
                                    {player.name}
                                  </Link>
                                  {player.verified && (
                                    <span title={t.playersPage.verifiedBadge} className="text-zinc-900">
                                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                  <span>{player.countryFlag}</span>
                                  <span>
                                    {player.countryName[lang]} • {player.age} {t.playersPage.ageLabel}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                                  {player.statusLabel[lang]}
                                </span>
                                <BookmarkButton playerId={player.id} playerName={player.name} size="sm" />
                              </div>
                              {(player.packagePreference || player.packagePreferenceLabel) && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">
                                  {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Athletic Specs Strip */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-center mb-4 text-xs">
                            <div>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                                {t.playersPage.positionFilter}
                              </span>
                              <span className="font-bold text-zinc-900">{player.positionName[lang]}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                                {t.playersPage.gripFilter}
                              </span>
                              <span className="font-bold text-zinc-900">{player.gripName[lang]}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                                {t.playersPage.prevClubLabel}
                              </span>
                              <span className="font-bold text-zinc-900 truncate block">
                                {player.previousClub}
                              </span>
                            </div>
                          </div>

                          {/* Geographic Mobility & Civil Profile Badges */}
                          <div className="mb-4 p-2.5 bg-zinc-50/60 rounded-lg border border-zinc-200/80 text-[11px] space-y-1.5">
                            {/* Target Countries */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-zinc-600 text-[10px] uppercase tracking-wider">
                                {t.playersPage.openInCountriesLabel}:
                              </span>
                              {player.targetCountries?.includes("ALL") ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                                  🌍 {lang === "sv" ? "Hela världen" : "Worldwide"}
                                </span>
                              ) : player.targetCountries && player.targetCountries.length > 0 ? (
                                player.targetCountries.map((code) => {
                                  const c = getCountry(code);
                                  return (
                                    <span
                                      key={code}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-800 border border-zinc-200 text-[10px] font-medium"
                                    >
                                      <span>{c?.flag || "🏳️"}</span>
                                      <span>{c ? c.names[lang] : code}</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-zinc-600 text-[10px]">{player.countryName[lang]}</span>
                              )}
                            </div>

                            {/* National Team & Heritage Info */}
                            {(player.openForNationalTeam || (player.secondaryCitizenships && player.secondaryCitizenships.length > 0) || player.heritageCountry) && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-200/60 text-[10px]">
                                {player.openForNationalTeam && (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold">
                                    🌍 {lang === "sv" ? "Öppen för landslag" : "Open for National Team"}
                                  </span>
                                )}
                                {player.secondaryCitizenships?.map((code) => {
                                  const c = getCountry(code);
                                  return (
                                    <span key={code} className="px-1.5 py-0.5 rounded bg-white text-zinc-800 border border-zinc-200 font-medium">
                                      🛂 {c?.flag || ""} {c ? c.names[lang] : code}
                                    </span>
                                  );
                                })}
                                {player.heritageCountry && (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-medium truncate max-w-[200px]" title={player.heritageCountry}>
                                    🧬 {player.heritageCountry}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Civil / Career Preferences */}
                            {player.occupationPreferences && player.occupationPreferences.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-zinc-200/60">
                                {player.occupationPreferences.includes("studies") && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-medium">
                                    🎓 {t.occupationPreferences.studies}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("fulltime_job") && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium">
                                    💼 {t.occupationPreferences.fulltime_job}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("parttime_job") && (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-medium">
                                    🕒 {t.occupationPreferences.parttime_job}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("housing") && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                                    🏠 {t.occupationPreferences.housing}
                                  </span>
                                )}
                                {player.occupationPreferences.includes("sports_only") && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                                    🏒 {t.occupationPreferences.sports_only}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Spoken Languages */}
                            {player.spokenLanguages && player.spokenLanguages.length > 0 && (
                              <div className="flex items-center gap-1 pt-1 border-t border-zinc-200/60 text-[10px] text-zinc-600">
                                <span className="font-semibold text-zinc-500 uppercase tracking-wider">
                                  {t.playersPage.spokenLanguagesLabel}:
                                </span>
                                <span className="font-medium text-zinc-800">
                                  {player.spokenLanguages.map((code) => getLanguageName(code, lang)).join(", ")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Key Attributes Tags (Only if defined) */}
                          {player.skills[lang] && player.skills[lang].length > 0 && (
                            <div className="mb-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                                {t.playersPage.skillsLabel}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {player.skills[lang].map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bio Snippet */}
                          <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed mb-2">
                            {player.bio[lang]}
                          </p>

                          {/* Social media links if available */}
                          <SocialLinks
                            instagramUrl={player.instagramUrl}
                            youtubeUrl={player.youtubeUrl}
                            tiktokUrl={player.tiktokUrl}
                          />
                        </div>

                        {/* Card CTA Footer */}
                        <div className="border-t border-zinc-100 pt-4 flex items-center justify-between gap-3">
                          <Link
                            href={`/players/${player.id}`}
                            className="text-xs font-semibold text-zinc-900 hover:text-zinc-700 underline"
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
                            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
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
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider">
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
                        <tbody className="divide-y divide-zinc-100 text-zinc-800">
                          {filteredPlayers.map((player) => (
                            <tr key={player.id} className="hover:bg-zinc-50/80 transition-colors">
                              <td className="py-3 px-4 font-bold text-zinc-950 whitespace-nowrap">
                                <Link href={`/players/${player.id}`} className="hover:underline flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-zinc-900 text-white font-bold text-[10px] flex items-center justify-center overflow-hidden shrink-0">
                                    {player.photoUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{player.avatarInitials}</span>
                                    )}
                                  </div>
                                  <span>{player.name}</span>
                                  {player.verified && (
                                    <span className="text-zinc-900 text-[10px]">✓</span>
                                  )}
                                </Link>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap font-medium">
                                {player.positionName[lang]}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-zinc-600">
                                {player.age}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="mr-1">{player.countryFlag}</span>
                                <span>{player.countryName[lang]}</span>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-zinc-600">
                                {player.previousClub}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                                    {player.statusLabel[lang]}
                                  </span>
                                  {(player.packagePreference || player.packagePreferenceLabel) && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">
                                      {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang]}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {player.openForNationalTeam ? (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 text-[10px] font-semibold">
                                    🌍 Open
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 text-[10px]">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                                <BookmarkButton playerId={player.id} playerName={player.name} size="sm" />
                                <Link
                                  href={`/players/${player.id}`}
                                  className="font-semibold text-zinc-900 hover:underline"
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
                  <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400 text-xl font-bold">
                      ∅
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 mb-1">
                      {lang === "sv" ? "Inga spelarprofiler hittades" : "No players match your filters"}
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                      {lang === "sv"
                        ? "Testa att nollställa dina filter eller registrera en ny spelarprofil gratis."
                        : "Try adjusting your search criteria or register a player profile for free."}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {t.search.resetBtn}
                      </button>
                      <Link
                        href="/join"
                        className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
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
