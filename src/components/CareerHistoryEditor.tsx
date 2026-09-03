'use client';

import React from 'react';
import { CareerSeason } from '@/types';

interface CareerHistoryEditorProps {
  careerHistory: CareerSeason[];
  onChange: (history: CareerSeason[]) => void;
  lang?: string;
}

const COMMON_LEAGUES = [
  'Elitserien',
  'Allsvenskan',
  'Div 1',
  'Juniorallsvenskan (P19)',
  'P17 Nationell',
  'Utland',
  'Ungdom',
];

const DEFAULT_SEASONS = [
  '2025/26',
  '2024/25',
  '2023/24',
  '2022/23',
  '2021/22',
  '2020/21',
  '2019/20',
  '2018/19',
];

export function CareerHistoryEditor({ careerHistory, onChange, lang = 'sv' }: CareerHistoryEditorProps) {
  const handleAddRow = () => {
    let nextSeason = '2025/26';
    if (careerHistory.length > 0) {
      const lastSeason = careerHistory[careerHistory.length - 1].season;
      const idx = DEFAULT_SEASONS.indexOf(lastSeason);
      if (idx !== -1 && idx + 1 < DEFAULT_SEASONS.length) {
        nextSeason = DEFAULT_SEASONS[idx + 1];
      }
    }

    const newRow: CareerSeason = {
      season: nextSeason,
      club: '',
      league: 'Elitserien',
      role: '',
    };
    onChange([...careerHistory, newRow]);
  };

  const handleUpdateRow = (index: number, field: keyof CareerSeason, value: string) => {
    const updated = careerHistory.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemoveRow = (index: number) => {
    onChange(careerHistory.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {careerHistory.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 text-center">
          <p className="text-xs text-zinc-500 mb-2">
            {lang === 'sv'
              ? 'Inga tidigare säsonger tillagda än. Lägg till dina tidigare klubbar och serier här!'
              : 'No past seasons added yet. Add your previous clubs and leagues here!'}
          </p>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            <span>+</span>
            <span>{lang === 'sv' ? 'Lägg till första säsongen' : 'Add first season'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {careerHistory.map((row, index) => (
            <div
              key={index}
              className="p-3 rounded-xl border border-zinc-200 bg-white shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
            >
              {/* Season or Interval */}
              <div className="w-full md:w-44 shrink-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                  {lang === 'sv' ? 'Säsong / Period' : 'Season / Period'}
                </label>
                <input
                  type="text"
                  value={row.season}
                  onChange={(e) => handleUpdateRow(index, 'season', e.target.value)}
                  placeholder="2024/25 - 2026/27"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Club */}
              <div className="w-full md:flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                  {lang === 'sv' ? 'Klubb' : 'Club'}
                </label>
                <input
                  type="text"
                  value={row.club}
                  onChange={(e) => handleUpdateRow(index, 'club', e.target.value)}
                  placeholder={lang === 'sv' ? 'Klubbnamn, t.ex. Bollnäs GIF' : 'Club name, e.g. Bollnäs GIF'}
                  className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* League / Level */}
              <div className="w-full md:w-44 shrink-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                  {lang === 'sv' ? 'Serie / Nivå' : 'League / Level'}
                </label>
                <input
                  list={`league-options-${index}`}
                  type="text"
                  value={row.league}
                  onChange={(e) => handleUpdateRow(index, 'league', e.target.value)}
                  placeholder="Elitserien"
                  className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                />
                <datalist id={`league-options-${index}`}>
                  {COMMON_LEAGUES.map((lg) => (
                    <option key={lg} value={lg} />
                  ))}
                </datalist>
              </div>

              {/* Role / Note */}
              <div className="w-full md:w-48 shrink-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                  {lang === 'sv' ? 'Notering / Roll' : 'Note / Role'}
                </label>
                <input
                  type="text"
                  value={row.role || ''}
                  onChange={(e) => handleUpdateRow(index, 'role', e.target.value)}
                  placeholder={lang === 'sv' ? 't.ex. Ordinarie / SM-guld' : 'e.g. Starter / Captain'}
                  className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Delete Button */}
              <div className="flex justify-end md:shrink-0">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  title={lang === 'sv' ? 'Ta bort rad' : 'Remove row'}
                  className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              <span>+</span>
              <span>{lang === 'sv' ? 'Lägg till säsong / klubbsejour' : 'Add season / club stint'}</span>
            </button>
            <span className="text-[11px] text-zinc-400">
              {careerHistory.length} {lang === 'sv' ? 'säsonger listade' : 'seasons listed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
