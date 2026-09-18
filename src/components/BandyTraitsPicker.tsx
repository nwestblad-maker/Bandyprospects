'use client';

import React from 'react';
import { BANDY_TRAITS, BandyTrait } from '@/data/attributes';

interface BandyTraitsPickerProps {
  selectedTraits: string[];
  onChange: (traits: string[]) => void;
  lang?: string;
}

export function BandyTraitsPicker({ selectedTraits, onChange, lang = 'en' }: BandyTraitsPickerProps) {
  const toggleTrait = (name: string) => {
    if (selectedTraits.includes(name)) {
      onChange(selectedTraits.filter((t) => t !== name));
    } else {
      onChange([...selectedTraits, name]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {BANDY_TRAITS.map((trait: BandyTrait) => {
          const isSelected = selectedTraits.includes(trait.name) || (Boolean(trait.swedishAlias) && selectedTraits.includes(trait.swedishAlias!));
          return (
            <button
              key={trait.name}
              type="button"
              onClick={() => toggleTrait(trait.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs scale-100 border border-slate-900'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{trait.icon}</span>
              <span>{trait.name}</span>
              {isSelected && <span className="text-[10px] text-slate-400">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
        <span>
          Select 2–6 traits that best define your player profile.
        </span>
        <span className="font-semibold text-slate-800">
          {selectedTraits.length} selected
        </span>
      </div>
    </div>
  );
}
