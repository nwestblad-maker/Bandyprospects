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
        {label && <label className="block font-semibold text-slate-800 text-xs">{label}</label>}
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
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
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <span>{region.name[lang] || region.name.en}</span>
              {isSelected && <span>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Selected Country Badges */}
      {selectedCodes.length > 0 && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Selected Destinations ({selectedCodes.length}):
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] text-slate-500 hover:text-slate-900 underline font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {isWorldwide ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-medium">
                <span>🌍</span>
                <span>Open Worldwide</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="hover:text-slate-300 font-bold ml-1"
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs"
                  >
                    <span>{country?.flag || "🏳️"}</span>
                    <span>{country ? country.names.en || country.names[lang] : code}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(code)}
                      className="text-slate-400 hover:text-slate-900 font-bold ml-0.5"
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
          className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 text-slate-600">
            <span>+</span>
            <span>Add specific countries from the world list...</span>
          </span>
          <span className="text-slate-400">{isDropdownOpen ? "▲" : "▼"}</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden text-xs">
            <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country to add..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {filteredCountries.map((c) => {
                const isSelected = selectedCodes.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleToggleCountry(c.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 transition-colors ${
                      isSelected ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{c.flag}</span>
                      <span>{c.names[lang] || c.names.en}</span>
                      <span className="text-slate-400 text-[10px] font-mono">({c.code})</span>
                    </span>
                    {isSelected && <span className="text-slate-900 font-bold">✓</span>}
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
