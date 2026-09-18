"use client";

import React from "react";
import { CountrySelect } from "@/components/CountrySelect";
import { LeagueSelect } from "@/components/LeagueSelect";
import { useLanguage } from "@/context/LanguageContext";

export interface ClubAdFiltersProps {
  selectedOrgType: "all" | "club" | "national_team";
  setSelectedOrgType: (type: "all" | "club" | "national_team") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedTeamCategory: string;
  setSelectedTeamCategory: (category: string) => void;
  selectedPerk: string;
  setSelectedPerk: (perk: string) => void;
  activeFilterCount: number;
  handleResetFilters: () => void;
  totalMatches: number;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function ClubAdFilters({
  selectedOrgType,
  setSelectedOrgType,
  searchQuery,
  setSearchQuery,
  selectedCountry,
  setSelectedCountry,
  selectedLeague,
  setSelectedLeague,
  selectedRole,
  setSelectedRole,
  selectedTeamCategory,
  setSelectedTeamCategory,
  selectedPerk,
  setSelectedPerk,
  activeFilterCount,
  handleResetFilters,
  totalMatches,
  isMobile = false,
  onCloseMobile,
}: ClubAdFiltersProps) {
  const { lang, t } = useLanguage();

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-xl p-5 ${
        isMobile ? "shadow-md" : "shadow-sm"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            {t.marketPage.filtersTitle}
          </h2>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-950 underline cursor-pointer"
            >
              {t.marketPage.clearFilters}
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 text-sm font-bold cursor-pointer"
              aria-label="Close filters"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Search */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Search (club, city, role)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.marketPage.searchPlaceholder}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 text-xs"
            />
          </div>
        </div>

        {/* Organization Type Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Organization
          </label>
          <select
            value={selectedOrgType}
            onChange={(e) => setSelectedOrgType(e.target.value as "all" | "club" | "national_team")}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer text-xs"
          >
            <option value="all">All Organizations</option>
            <option value="club">🏟️ Club Teams</option>
            <option value="national_team">🌍 National Teams</option>
          </select>
        </div>

        {/* Country Filter */}
        <div>
          <CountrySelect
            label={t.marketPage.countryFilter}
            value={selectedCountry === "all" ? "" : selectedCountry}
            onChange={(code) => {
              setSelectedCountry(code || "all");
              setSelectedLeague("all");
            }}
            includeAllOption={true}
            allOptionLabel="All Countries"
          />
        </div>

        {/* League / Division Filter */}
        {selectedOrgType !== "national_team" && (
          <div>
            <LeagueSelect
              countryCode={selectedCountry === "all" ? "SE" : selectedCountry}
              value={selectedLeague === "all" ? "" : selectedLeague}
              onChange={(leagueId) => setSelectedLeague(leagueId || "all")}
              label={t.marketPage.leagueFilter}
              includeAllOption={true}
              allOptionLabel="All Leagues & Series"
            />
          </div>
        )}

        {/* Position Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            {t.marketPage.roleFilter}
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer text-xs"
          >
            <option value="all">{t.positions.all}</option>
            <option value="goalkeeper">{t.positions.goalkeeper}</option>
            <option value="defender">{t.positions.defender}</option>
            <option value="halv">{t.positions.halv}</option>
            <option value="midfielder">{t.positions.midfielder}</option>
            <option value="forward">{t.positions.forward}</option>
          </select>
        </div>

        {/* Team Category Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            {t.marketPage.teamCategoryFilter}
          </label>
          <select
            value={selectedTeamCategory}
            onChange={(e) => setSelectedTeamCategory(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer text-xs"
          >
            <option value="all">{t.marketPage.teamTypeAll}</option>
            <option value="men">{t.marketPage.teamTypeMen}</option>
            <option value="women">{t.marketPage.teamTypeWomen}</option>
            <option value="junior">{t.marketPage.teamTypeJunior}</option>
          </select>
        </div>

        {/* Benefits Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            {t.marketPage.benefitsFilter}
          </label>
          <select
            value={selectedPerk}
            onChange={(e) => setSelectedPerk(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer text-xs"
          >
            <option value="all">{t.marketPage.allBenefits}</option>
            <option value="job">{t.marketPage.benefitJob}</option>
            <option value="studies">{t.marketPage.benefitStudies}</option>
            <option value="housing">{t.marketPage.benefitHousing}</option>
            <option value="salary">{t.marketPage.benefitSalary}</option>
            <option value="travel">{t.marketPage.benefitTravel}</option>
            <option value="equipment">{t.perks.equipment}</option>
            <option value="gym">{t.perks.gym}</option>
          </select>
        </div>

        {/* Reset & Apply Actions */}
        <div className="pt-2 space-y-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2 px-3 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              {t.search.resetBtn}
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-full py-2.5 px-4 text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Show {totalMatches} listings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
