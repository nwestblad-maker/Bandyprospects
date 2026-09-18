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

  const defaultLabel = "Key Attributes on Ice (Select up to 4)";
  const defaultSubtitle = "Select the core strengths that best highlight your gameplay style.";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            {label || defaultLabel}
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {subtitle || defaultSubtitle}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            selectedAttributes.length === maxAttributes
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : selectedAttributes.length > 0
              ? "bg-slate-100 text-slate-900 border border-slate-200"
              : "bg-slate-100 text-slate-400"
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
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold"
                  : isMaxReached
                  ? "bg-slate-50/50 text-slate-400 border-slate-200/60 opacity-60 cursor-not-allowed"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs">
                <span className="text-base">{attr.icon}</span>
                <span>{attr.names.en || attr.names[lang]}</span>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSelected
                    ? "bg-white text-slate-950"
                    : "border border-slate-300 text-transparent"
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
