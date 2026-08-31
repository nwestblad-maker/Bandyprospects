'use client';

import React from 'react';
import { COUNTRIES } from '@/lib/formatters';

export default function CountryMultiSelect({
  selectedCountries = [],
  onChange,
  label = 'Medborgarskap / Pass (Välj alla som gäller)',
}: {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  label?: string;
}) {
  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      onChange(selectedCountries.filter((c) => c !== code));
    } else {
      onChange([...selectedCountries, code]);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-slate-800">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {COUNTRIES.map((country) => {
          const isSelected = selectedCountries.includes(country.code);
          return (
            <button
              type="button"
              key={country.code}
              onClick={() => toggleCountry(country.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {country.name} {isSelected && '✓'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CountryMultiSelect };
