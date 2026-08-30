"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { KEY_ATTRIBUTES, KeyAttributeKey } from "@/data/attributes";

interface KeyAttributesPickerProps {
  selectedAttributes: string[];
  onChange: (attributes: string[]) => void;
  maxAttributes?: number;
  label?: string;
  subtitle?: string;
}

export function KeyAttributesPicker({
  selectedAttributes,
  onChange,
  maxAttributes = 4,
  label,
  subtitle,
}: KeyAttributesPickerProps) {
  const { lang, t } = useLanguage();

  const handleToggle = (key: KeyAttributeKey) => {
    if (selectedAttributes.includes(key)) {
      onChange(selectedAttributes.filter((k) => k !== key));
    } else {
      if (selectedAttributes.length >= maxAttributes) {
        return;
      }
      onChange([...selectedAttributes, key]);
    }
  };

  const defaultLabel =
    lang === "sv"
      ? "Nyckelegenskaper på isen (Välj upp till 4)"
      : lang === "fi"
      ? "Tärkeimmät vahvuudet jäällä (Valitse enintään 4)"
      : lang === "no"
      ? "Nøkkelegenskaper på isen (Velg opptil 4)"
      : "Key Attributes on Ice (Select up to 4)";

  const defaultSubtitle =
    lang === "sv"
      ? "Välj de spetskompetenser som bäst definierar dig som bandyspelare."
      : lang === "fi"
      ? "Valitse vahvuudet, jotka parhaiten kuvaavat sinua pelaajana."
      : lang === "no"
      ? "Velg egenskapene som best definerer deg som bandyspiller."
      : "Select the core strengths that best highlight your gameplay style.";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-zinc-700">
            {label || defaultLabel}
          </label>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {subtitle || defaultSubtitle}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            selectedAttributes.length === maxAttributes
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : selectedAttributes.length > 0
              ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          {selectedAttributes.length} / {maxAttributes}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {KEY_ATTRIBUTES.map((attr) => {
          const isSelected = selectedAttributes.includes(attr.key);
          const isMaxReached = selectedAttributes.length >= maxAttributes && !isSelected;

          return (
            <button
              type="button"
              key={attr.key}
              onClick={() => handleToggle(attr.key)}
              disabled={isMaxReached}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                isSelected
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs font-semibold"
                  : isMaxReached
                  ? "bg-zinc-50/50 text-zinc-400 border-zinc-200/60 opacity-60 cursor-not-allowed"
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs">
                <span className="text-base">{attr.icon}</span>
                <span>{attr.names[lang]}</span>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSelected
                    ? "bg-white text-zinc-950"
                    : "border border-zinc-300 text-transparent"
                }`}
              >
                ✓
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
