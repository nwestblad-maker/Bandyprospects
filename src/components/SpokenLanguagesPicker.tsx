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
        {label && <label className="block font-semibold text-slate-800 text-xs">{label}</label>}
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
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
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              <span>{langItem.flag}</span>
              <span>{langItem.name.en || langItem.name[lang] || langItem.code}</span>
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
          placeholder="Add other language..."
          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 text-xs transition-colors cursor-pointer"
        >
          + Add
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium"
              >
                <span>🗣️ {custom}</span>
                <button
                  type="button"
                  onClick={() => onChange(selectedLanguages.filter((l) => l !== custom))}
                  className="text-slate-400 hover:text-slate-900 font-bold ml-1 cursor-pointer"
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
