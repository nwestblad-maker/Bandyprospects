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

  const customOptionLabel = useMemo(() => {
    switch (lang) {
      case "sv":
        return "Annat (skriv själv)...";
      case "fi":
        return "Muu (kirjoita itse)...";
      case "no":
        return "Annet (skriv selv)...";
      default:
        return "Other (specify)...";
    }
  }, [lang]);

  const customPlaceholder = useMemo(() => {
    switch (lang) {
      case "sv":
        return "Ange liganamn / serie...";
      case "fi":
        return "Kirjoita sarjatason nimi...";
      case "no":
        return "Oppgi liganavn...";
      default:
        return "Enter league / division name...";
    }
  }, [lang]);

  const defaultAllLabel = useMemo(() => {
    switch (lang) {
      case "sv":
        return "Alla serier & ligor";
      case "fi":
        return "Kaikki sarjat";
      case "no":
        return "Alle ligaer";
      default:
        return "All Leagues & Divisions";
    }
  }, [lang]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-700">
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
        className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer disabled:opacity-50"
      >
        {includeAllOption && (
          <option value="all">{allOptionLabel || defaultAllLabel}</option>
        )}

        {leagues.map((league) => (
          <option key={league.id} value={league.id}>
            {league.name[lang]}
          </option>
        ))}

        {showCustomOption && (
          <option value={CUSTOM_OTHER_LEAGUE_VALUE}>
            ✏️ {customOptionLabel}
          </option>
        )}
      </select>

      {/* Manual custom text input when "Annat (skriv själv)" is chosen */}
      {isCustom && onCustomLeagueNameChange && (
        <div className="pt-1 animate-in fade-in duration-150">
          <input
            type="text"
            required={required}
            value={customLeagueName}
            onChange={(e) => onCustomLeagueNameChange(e.target.value)}
            placeholder={customPlaceholder}
            className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
