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
  'Division 1',
  'Juniorallsvenskan (P19)',
  'P17 Nationell',
  'Bandyliiga',
  'Suomisarja',
  'Eliteserien (Norge)',
  'Utland',
  'Ungdom',
  'Övrigt',
];

const ALL_SEASONS = [
  '2026/27',
  '2025/26',
  '2024/25',
  '2023/24',
  '2022/23',
  '2021/22',
  '2020/21',
  '2019/20',
  '2018/19',
  '2017/18',
  '2016/17',
  '2015/16',
  '2014/15',
  '2013/14',
  '2012/13',
  '2011/12',
  '2010/11',
  '2009/10',
  '2008/09',
  '2007/08',
  '2006/07',
  '2005/06',
  '2004/05',
  '2003/04',
  '2002/03',
  '2001/02',
  '2000/01',
];

function computeSeasonString(from?: string, to?: string): string {
  const f = from?.trim();
  const t = to?.trim();
  if (f && t) {
    if (f === t) return f;
    return `${f} – ${t}`;
  }
  return f || t || '';
}

function getRowFromSeason(row: CareerSeason): string {
  if (row.from_season) return row.from_season;
  if (row.season) {
    const parts = row.season.split(/–|-/).map((s) => s.trim());
    return parts[0] || '2024/25';
  }
  return '2024/25';
}

function getRowToSeason(row: CareerSeason): string {
  if (row.to_season) return row.to_season;
  if (row.season) {
    const parts = row.season.split(/–|-/).map((s) => s.trim());
    return parts[1] || parts[0] || 'Nuvarande';
  }
  return 'Nuvarande';
}

export function CareerHistoryEditor({
  careerHistory,
  onChange,
  lang = 'sv',
}: CareerHistoryEditorProps) {
  const handleAddRow = () => {
    let nextFromSeason = '2024/25';
    let nextToSeason = 'Nuvarande';

    if (careerHistory.length > 0) {
      const lastRow = careerHistory[careerHistory.length - 1];
      const lastFrom = getRowFromSeason(lastRow);
      const idx = ALL_SEASONS.indexOf(lastFrom);
      if (idx !== -1 && idx + 1 < ALL_SEASONS.length) {
        nextToSeason = lastFrom;
        nextFromSeason = ALL_SEASONS[idx + 1];
      } else {
        nextFromSeason = '2023/24';
        nextToSeason = '2023/24';
      }
    }

    const season = computeSeasonString(nextFromSeason, nextToSeason);
    const newRow: CareerSeason = {
      from_season: nextFromSeason,
      to_season: nextToSeason,
      season,
      club: '',
      league: '',
      note: '',
      role: '',
    };
    onChange([...careerHistory, newRow]);
  };

  const handlePeriodChange = (index: number, newFrom: string, newTo: string) => {
    const updated = careerHistory.map((item, i) => {
      if (i === index) {
        const season = computeSeasonString(newFrom, newTo);
        return {
          ...item,
          from_season: newFrom,
          to_season: newTo,
          season,
        };
      }
      return item;
    });
    onChange(updated);
  };

  const handleUpdateRow = (
    index: number,
    field: keyof CareerSeason,
    value: string
  ) => {
    const updated = careerHistory.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'note') {
          updatedItem.role = value;
        } else if (field === 'role') {
          updatedItem.note = value;
        }
        return updatedItem;
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
        <div className="p-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 text-center">
          <p className="text-xs text-zinc-500 mb-2.5">
            {lang === 'sv'
              ? 'Inga tidigare säsonger tillagda än. Lägg till dina tidigare klubbar och serier här!'
              : 'No past seasons added yet. Add your previous clubs and leagues here!'}
          </p>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            <span>+</span>
            <span>{lang === 'sv' ? 'Lägg till första säsongen' : 'Add first season'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Desktop Column Headers */}
          <div className="hidden md:flex items-center gap-2.5 px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <div className="w-[185px] shrink-0">
              {lang === 'sv' ? 'Period / Säsonger' : 'Period / Seasons'}
            </div>
            <div className="flex-1 min-w-[160px]">
              {lang === 'sv' ? 'Förening / Klubb' : 'Club / Team'}
            </div>
            <div className="w-36 shrink-0">
              {lang === 'sv' ? 'Serie / Nivå' : 'League / Level'}
            </div>
            <div className="flex-1 min-w-[140px]">
              {lang === 'sv' ? 'Notering / Roll (valfritt)' : 'Note / Role (optional)'}
            </div>
            <div className="w-8 shrink-0 text-center">
              <span className="sr-only">{lang === 'sv' ? 'Ta bort' : 'Remove'}</span>
            </div>
          </div>

          {/* Stint Rows */}
          {careerHistory.map((row, index) => {
            const fromSeason = getRowFromSeason(row);
            const toSeason = getRowToSeason(row);

            return (
              <div
                key={index}
                className="p-3.5 md:p-2.5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-2.5 hover:border-zinc-300 transition-colors"
              >
                {/* Period Selector */}
                <div className="w-full md:w-[185px] shrink-0">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                    {lang === 'sv' ? 'Period / Säsonger' : 'Period / Seasons'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={fromSeason}
                      onChange={(e) =>
                        handlePeriodChange(index, e.target.value, toSeason)
                      }
                      aria-label={lang === 'sv' ? 'Från säsong' : 'From season'}
                      className="flex-1 min-w-0 px-2 py-1.5 text-xs font-semibold border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      {!ALL_SEASONS.includes(fromSeason) && (
                        <option value={fromSeason}>{fromSeason}</option>
                      )}
                      {ALL_SEASONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span className="text-zinc-400 text-xs shrink-0 font-bold">–</span>
                    <select
                      value={toSeason}
                      onChange={(e) =>
                        handlePeriodChange(index, fromSeason, e.target.value)
                      }
                      aria-label={lang === 'sv' ? 'Till säsong' : 'To season'}
                      className="flex-1 min-w-0 px-2 py-1.5 text-xs font-semibold border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="Nuvarande">
                        {lang === 'sv' ? 'Nuvarande' : 'Current'}
                      </option>
                      {!ALL_SEASONS.includes(toSeason) &&
                        toSeason !== 'Nuvarande' &&
                        toSeason !== 'Current' && (
                          <option value={toSeason}>{toSeason}</option>
                        )}
                      {ALL_SEASONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Club Input */}
                <div className="w-full md:flex-1 md:min-w-[160px]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                    {lang === 'sv' ? 'Förening / Klubb' : 'Club / Team'}
                  </label>
                  <input
                    type="text"
                    value={row.club}
                    onChange={(e) => handleUpdateRow(index, 'club', e.target.value)}
                    placeholder="t.ex. Sandvikens AIK"
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>

                {/* League Select */}
                <div className="w-full md:w-36 shrink-0">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                    {lang === 'sv' ? 'Serie / Nivå' : 'League / Level'}
                  </label>
                  <select
                    value={row.league}
                    onChange={(e) => handleUpdateRow(index, 'league', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="">{lang === 'sv' ? 'Välj nivå' : 'Select level'}</option>
                    {COMMON_LEAGUES.map((lg) => (
                      <option key={lg} value={lg}>
                        {lg}
                      </option>
                    ))}
                    {row.league && !COMMON_LEAGUES.includes(row.league) && (
                      <option value={row.league}>{row.league}</option>
                    )}
                  </select>
                </div>

                {/* Note / Role */}
                <div className="w-full md:flex-1 md:min-w-[140px]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 md:hidden">
                    {lang === 'sv' ? 'Notering / Roll (valfritt)' : 'Note / Role (optional)'}
                  </label>
                  <input
                    type="text"
                    value={row.note || row.role || ''}
                    onChange={(e) => handleUpdateRow(index, 'note', e.target.value)}
                    placeholder="t.ex. Ordinarie, Kapten, 45 m"
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>

                {/* Remove Button */}
                <div className="flex justify-end md:w-8 shrink-0 md:justify-center pt-1 md:pt-0 border-t border-zinc-100 md:border-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    title={lang === 'sv' ? 'Ta bort sejour' : 'Remove stint'}
                    className="inline-flex items-center gap-1 md:justify-center w-full md:w-8 h-7 text-xs text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-semibold">✕</span>
                    <span className="md:hidden text-xs font-medium text-red-600">
                      {lang === 'sv' ? 'Ta bort sejour' : 'Remove stint'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              <span>+</span>
              <span>
                {lang === 'sv'
                  ? 'Lägg till säsong / klubbsejour'
                  : 'Add season / club stint'}
              </span>
            </button>
            <span className="text-[11px] text-zinc-400">
              {careerHistory.length}{' '}
              {lang === 'sv'
                ? careerHistory.length === 1
                  ? 'sejour listad'
                  : 'sejourer listade'
                : careerHistory.length === 1
                  ? 'stint listed'
                  : 'stints listed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
