"use client";

import React from "react";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { useLanguage } from "@/context/LanguageContext";

export interface PlayerFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPosition: string;
  setSelectedPosition: (pos: string) => void;
  selectedNationality: string;
  setSelectedNationality: (nat: string) => void;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
  selectedTargetCountry: string;
  setSelectedTargetCountry: (tc: string) => void;
  selectedCivilSetup: string;
  setSelectedCivilSetup: (cs: string) => void;
  selectedGrip: string;
  setSelectedGrip: (grip: string) => void;
  selectedStatus: string;
  setSelectedStatus: (st: string) => void;
  selectedNationalTeamOnly: boolean;
  setSelectedNationalTeamOnly: (val: boolean) => void;
  selectedHeritageCountry: string;
  setSelectedHeritageCountry: (hc: string) => void;
  activeFilterCount: number;
  handleResetFilters: () => void;
  totalMatches: number;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function PlayerFilters({
  searchQuery,
  setSearchQuery,
  selectedPosition,
  setSelectedPosition,
  selectedNationality,
  setSelectedNationality,
  selectedLeague,
  setSelectedLeague,
  selectedTargetCountry,
  setSelectedTargetCountry,
  selectedCivilSetup,
  setSelectedCivilSetup,
  selectedGrip,
  setSelectedGrip,
  selectedStatus,
  setSelectedStatus,
  selectedNationalTeamOnly,
  setSelectedNationalTeamOnly,
  selectedHeritageCountry,
  setSelectedHeritageCountry,
  activeFilterCount,
  handleResetFilters,
  totalMatches,
  isMobile = false,
  onCloseMobile,
}: PlayerFiltersProps) {
  const { lang, t } = useLanguage();

  return (
    <div
      className={`bg-white border border-zinc-200 rounded-xl p-5 ${
        isMobile ? "shadow-md" : "shadow-xs"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            {t.playersPage.filtersTitle}
          </h2>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 underline cursor-pointer"
            >
              {t.playersPage.clearFilters}
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 text-sm font-bold cursor-pointer"
              aria-label="Stäng filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Search Query */}
        <div>
          <label className="block font-semibold text-zinc-700 mb-1.5">
            {lang === "sv" ? "Sök (namn, klubb, ord)" : "Search (name, club, keyword)"}
          </label>
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
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 text-xs"
            />
          </div>
        </div>

        {/* National Team & FIB Scouting Section */}
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
            className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer text-xs"
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
            className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer text-xs"
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
            className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer text-xs"
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
            className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer text-xs"
          >
            <option value="all">{t.statuses.all}</option>
            <option value="available_free_agent">{t.statuses.available_free_agent}</option>
            <option value="open_for_trials">{t.statuses.open_for_trials}</option>
            <option value="seeking_26_27">{t.statuses.seeking_26_27}</option>
            <option value="open_abroad">{t.statuses.open_abroad}</option>
            <option value="contracted_transferable">{t.statuses.contracted_transferable}</option>
          </select>
        </div>

        {/* Reset & Apply Actions */}
        <div className="pt-2 space-y-2">
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="w-full py-2 px-3 text-center text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
            >
              {t.search.resetBtn}
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="w-full py-2.5 px-4 text-center text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {lang === "sv"
                ? `Visa ${totalMatches} spelare`
                : `Show ${totalMatches} players`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
