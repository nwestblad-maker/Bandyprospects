"use client";

import React, { useState } from "react";
import { SPOKEN_LANGUAGES } from "@/data/countries";
import { useLanguage } from "@/context/LanguageContext";

interface SpokenLanguagesPickerProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
  label?: string;
  subtitle?: string;
}

export function SpokenLanguagesPicker({
  selectedLanguages,
  onChange,
  label,
  subtitle,
}: SpokenLanguagesPickerProps) {
  const { lang } = useLanguage();
  const [customLanguage, setCustomLanguage] = useState("");

  const handleToggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      onChange(selectedLanguages.filter((l) => l !== code));
    } else {
      onChange([...selectedLanguages, code]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customLanguage.trim();
    if (!trimmed) return;
    if (!selectedLanguages.includes(trimmed)) {
      onChange([...selectedLanguages, trimmed]);
    }
    setCustomLanguage("");
  };

  return (
    <div className="space-y-3 text-xs">
      <div>
        {label && <label className="block font-semibold text-zinc-800 text-xs">{label}</label>}
        {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Grid of common languages */}
      <div className="flex flex-wrap gap-2">
        {SPOKEN_LANGUAGES.map((langItem) => {
          const isSelected = selectedLanguages.includes(langItem.code);
          return (
            <button
              key={langItem.code}
              type="button"
              onClick={() => handleToggleLanguage(langItem.code)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}
            >
              <span>{langItem.flag}</span>
              <span>{langItem.name[lang]}</span>
              {isSelected && <span>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Add custom / additional language */}
      <div className="flex gap-2 items-center pt-1">
        <input
          type="text"
          value={customLanguage}
          onChange={(e) => setCustomLanguage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder={lang === "sv" ? "Lägg till ytterligare språk..." : lang === "fi" ? "Lisää muu kieli..." : lang === "no" ? "Legg til annet språk..." : "Add other language..."}
          className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-lg border border-zinc-200 text-xs transition-colors"
        >
          {lang === "sv" ? "+ Lägg till" : "+ Add"}
        </button>
      </div>

      {/* Selected custom languages chips */}
      {selectedLanguages.filter((l) => !SPOKEN_LANGUAGES.some((sl) => sl.code === l)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedLanguages
            .filter((l) => !SPOKEN_LANGUAGES.some((sl) => sl.code === l))
            .map((custom) => (
              <span
                key={custom}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium"
              >
                <span>🗣️ {custom}</span>
                <button
                  type="button"
                  onClick={() => onChange(selectedLanguages.filter((l) => l !== custom))}
                  className="text-zinc-400 hover:text-zinc-900 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
