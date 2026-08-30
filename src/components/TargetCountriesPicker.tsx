"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { COUNTRIES, REGIONS, getCountry } from "@/data/countries";
import { useLanguage } from "@/context/LanguageContext";

interface TargetCountriesPickerProps {
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  label?: string;
  subtitle?: string;
}

export function TargetCountriesPicker({
  selectedCodes,
  onChange,
  label,
  subtitle,
}: TargetCountriesPickerProps) {
  const { lang } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isWorldwide = selectedCodes.includes("ALL");

  const handleToggleWorldwide = () => {
    if (isWorldwide) {
      onChange([]);
    } else {
      onChange(["ALL"]);
    }
  };

  const handleToggleRegion = (codes: string[]) => {
    // If worldwide was active, remove it and select this region
    let current = selectedCodes.filter((c) => c !== "ALL");
    const allIncluded = codes.every((code) => current.includes(code));

    if (allIncluded) {
      // Deselect these codes
      current = current.filter((c) => !codes.includes(c));
    } else {
      // Add missing codes
      codes.forEach((code) => {
        if (!current.includes(code)) {
          current.push(code);
        }
      });
    }
    onChange(current);
  };

  const handleToggleCountry = (code: string) => {
    let current = selectedCodes.filter((c) => c !== "ALL");
    if (current.includes(code)) {
      current = current.filter((c) => c !== code);
    } else {
      current.push(code);
    }
    onChange(current);
  };

  const handleRemove = (code: string) => {
    onChange(selectedCodes.filter((c) => c !== code));
  };

  const filteredCountries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return COUNTRIES;

    return COUNTRIES.filter((c) => {
      const nameInLang = (c.names[lang] || "").toLowerCase();
      const nameInEn = (c.names.en || "").toLowerCase();
      const code = c.code.toLowerCase();
      return nameInLang.includes(term) || nameInEn.includes(term) || code.includes(term);
    });
  }, [searchTerm, lang]);

  return (
    <div className="space-y-3 text-xs">
      <div>
        {label && <label className="block font-semibold text-zinc-800 text-xs">{label}</label>}
        {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Quick Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => {
          const isSelected =
            region.id === "worldwide"
              ? isWorldwide
              : !isWorldwide && region.countryCodes.every((c) => selectedCodes.includes(c));

          return (
            <button
              key={region.id}
              type="button"
              onClick={() =>
                region.id === "worldwide"
                  ? handleToggleWorldwide()
                  : handleToggleRegion(region.countryCodes)
              }
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}
            >
              <span>{region.name[lang]}</span>
              {isSelected && <span>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Selected Country Badges */}
      {selectedCodes.length > 0 && (
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {lang === "sv" ? "Valda destinationer" : lang === "fi" ? "Valitut kohdemaat" : lang === "no" ? "Valgte destinasjoner" : "Selected Destinations"} ({selectedCodes.length}):
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] text-zinc-500 hover:text-zinc-900 underline font-medium"
            >
              {lang === "sv" ? "Rensa alla" : "Clear all"}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {isWorldwide ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 text-white text-xs font-medium">
                <span>🌍</span>
                <span>{lang === "sv" ? "Öppen för hela världen" : lang === "fi" ? "Avoin koko maailmalle" : lang === "no" ? "Åpen for hele verden" : "Open Worldwide"}</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="hover:text-zinc-300 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ) : (
              selectedCodes.map((code) => {
                const country = getCountry(code);
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-800 text-xs font-medium shadow-2xs"
                  >
                    <span>{country?.flag || "🏳️"}</span>
                    <span>{country ? country.names[lang] : code}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(code)}
                      className="text-zinc-400 hover:text-zinc-900 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Specific Country Search Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-700 hover:border-zinc-300 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-zinc-600">
            <span>+</span>
            <span>
              {lang === "sv"
                ? "Lägg till specifika länder från listan..."
                : lang === "fi"
                ? "Lisää yksittäisiä maita listasta..."
                : lang === "no"
                ? "Legg til spesifikke land fra listen..."
                : "Add specific countries from the world list..."}
            </span>
          </span>
          <span className="text-zinc-400">{isDropdownOpen ? "▲" : "▼"}</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden text-xs">
            <div className="p-2 border-b border-zinc-100 bg-zinc-50 sticky top-0 z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === "sv" ? "Sök land att lägga till..." : "Search country to add..."}
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-zinc-50">
              {filteredCountries.map((c) => {
                const isSelected = selectedCodes.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleToggleCountry(c.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100 transition-colors ${
                      isSelected ? "bg-zinc-100 font-semibold text-zinc-950" : "text-zinc-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{c.flag}</span>
                      <span>{c.names[lang]}</span>
                      <span className="text-zinc-400 text-[10px] font-mono">({c.code})</span>
                    </span>
                    {isSelected && <span className="text-zinc-900 font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
