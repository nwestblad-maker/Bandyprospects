"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { COUNTRIES, getCountry } from "@/data/countries";
import { CountryItem } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  className = "",
  includeAllOption = false,
  allOptionLabel,
}: CountrySelectProps) {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const selectedCountry = useMemo(() => {
    if (!value || value === "all") return null;
    return getCountry(value);
  }, [value]);

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

  // Separate into Popular and Others when no search term is active
  const { popularList, othersList } = useMemo(() => {
    if (searchTerm.trim()) {
      return { popularList: [], othersList: filteredCountries };
    }
    const popular = filteredCountries.filter((c) => c.popularBandy);
    const others = filteredCountries.filter((c) => !c.popularBandy);
    return { popularList: popular, othersList: others };
  }, [filteredCountries, searchTerm]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  const displayText = useMemo(() => {
    if (value === "all" || (!value && includeAllOption)) {
      return allOptionLabel || t.nationalities.all || "All Countries";
    }
    if (selectedCountry) {
      return `${selectedCountry.flag} ${selectedCountry.names[lang]} (${selectedCountry.code})`;
    }
    if (value) {
      return value.toUpperCase();
    }
    return placeholder || (lang === "sv" ? "Välj land..." : "Select country...");
  }, [value, selectedCountry, lang, includeAllOption, allOptionLabel, t, placeholder]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block font-semibold text-zinc-700 mb-1 text-xs">
          {label} {required && "*"}
        </label>
      )}

      {/* Select trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-zinc-50 border rounded-lg text-xs transition-colors text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-900 ${
          isOpen ? "border-zinc-900 ring-1 ring-zinc-900 bg-white" : "border-zinc-200 hover:border-zinc-300"
        } ${!selectedCountry && value !== "all" ? "text-zinc-500" : "text-zinc-900 font-medium"}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-sm">{selectedCountry.flag}</span>
              <span className="text-zinc-900 font-semibold">{selectedCountry.names[lang]}</span>
              <span className="text-zinc-400 text-[10px] font-mono font-normal">({selectedCountry.code})</span>
            </>
          ) : (
            <span>{displayText}</span>
          )}
        </span>

        <span className="text-zinc-400 text-xs ml-2 pointer-events-none">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg max-h-72 flex flex-col overflow-hidden text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-zinc-100 bg-zinc-50 sticky top-0 z-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === "sv" ? "Sök land (namn, kod)..." : lang === "fi" ? "Hae maata..." : lang === "no" ? "Søk land..." : "Search country (name, code)..."}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>

          {/* List options */}
          <div className="overflow-y-auto flex-1 divide-y divide-zinc-50">
            {includeAllOption && !searchTerm && (
              <button
                type="button"
                onClick={() => handleSelect("all")}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100 transition-colors ${
                  value === "all" ? "bg-zinc-100 font-bold text-zinc-950" : "text-zinc-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🌍</span>
                  <span>{allOptionLabel || t.nationalities.all || "All Countries"}</span>
                </span>
                {value === "all" && <span className="text-zinc-900">✓</span>}
              </button>
            )}

            {/* Popular / Bandy Nations Section */}
            {popularList.length > 0 && (
              <div>
                <div className="px-3 py-1 bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {lang === "sv" ? "Vanliga bandynationer" : lang === "fi" ? "Keskeiset jääpallomaat" : lang === "no" ? "Sentrale bandynasjoner" : "Key Bandy Nations"}
                </div>
                {popularList.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code.toLowerCase())}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100 transition-colors ${
                      value.toUpperCase() === country.code ? "bg-zinc-100 font-bold text-zinc-950" : "text-zinc-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{country.flag}</span>
                      <span>{country.names[lang]}</span>
                      <span className="text-zinc-400 text-[10px] font-mono">({country.code})</span>
                    </span>
                    {value.toUpperCase() === country.code && <span className="text-zinc-900 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* All / Filtered Countries */}
            {othersList.length > 0 ? (
              <div>
                {!searchTerm && (
                  <div className="px-3 py-1 bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {lang === "sv" ? "Alla länder (A-Ö)" : lang === "fi" ? "Kaikki maat (A-Ö)" : lang === "no" ? "Alle land (A-Å)" : "All Countries (A-Z)"}
                  </div>
                )}
                {othersList.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code.toLowerCase())}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100 transition-colors ${
                      value.toUpperCase() === country.code ? "bg-zinc-100 font-bold text-zinc-950" : "text-zinc-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{country.flag}</span>
                      <span>{country.names[lang]}</span>
                      <span className="text-zinc-400 text-[10px] font-mono">({country.code})</span>
                    </span>
                    {value.toUpperCase() === country.code && <span className="text-zinc-900 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            ) : (
              popularList.length === 0 && (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  {lang === "sv" ? "Inga länder hittades" : "No countries found"}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
