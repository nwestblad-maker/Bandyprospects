"use client";

import React, { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getLeaguesForCountry, CUSTOM_OTHER_LEAGUE_VALUE, LeagueItem } from "@/lib/leagues";

interface LeagueSelectProps {
  countryCode?: string | null;
  value: string;
  onChange: (leagueIdOrCustom: string) => void;
  customLeagueName?: string;
  onCustomLeagueNameChange?: (name: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  showCustomOption?: boolean;
  disabled?: boolean;
}

export function LeagueSelect({
  countryCode,
  value,
  onChange,
  customLeagueName = "",
  onCustomLeagueNameChange,
  label,
  required = false,
  className = "",
  includeAllOption = false,
  allOptionLabel,
  showCustomOption = true,
  disabled = false,
}: LeagueSelectProps) {
  const { lang, t } = useLanguage();

  const leagues = useMemo(() => {
    return getLeaguesForCountry(countryCode);
  }, [countryCode]);

  const isCustom = value === CUSTOM_OTHER_LEAGUE_VALUE;

  const customOptionLabel = "Other (specify)...";
  const customPlaceholder = "Enter league / division name...";
  const defaultAllLabel = "All Leagues & Divisions";

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => {
          const selected = e.target.value;
          onChange(selected);
        }}
        className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors cursor-pointer disabled:opacity-50"
      >
        {includeAllOption && (
          <option value="all">{allOptionLabel || defaultAllLabel}</option>
        )}

        {leagues.map((league) => (
          <option key={league.id} value={league.id}>
            {league.name.en || league.name[lang] || league.name.sv}
          </option>
        ))}

        {showCustomOption && (
          <option value={CUSTOM_OTHER_LEAGUE_VALUE}>
            ✏️ {customOptionLabel}
          </option>
        )}
      </select>

      {/* Manual custom text input when "Other (specify)" is chosen */}
      {isCustom && onCustomLeagueNameChange && (
        <div className="pt-1 animate-in fade-in duration-150">
          <input
            type="text"
            required={required}
            value={customLeagueName}
            onChange={(e) => onCustomLeagueNameChange(e.target.value)}
            placeholder={customPlaceholder}
            className="w-full text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
