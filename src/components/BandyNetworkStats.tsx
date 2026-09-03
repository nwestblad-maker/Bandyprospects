'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PlayerProfile } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { SupabasePlayerRow, transformSupabasePlayer } from '@/lib/dataMappers';

interface BandyNetworkStatsProps {
  players?: PlayerProfile[];
  lang?: string;
}

export function BandyNetworkStats({ players: initialPlayers, lang = 'sv' }: BandyNetworkStatsProps) {
  const [playersList, setPlayersList] = useState<PlayerProfile[]>(initialPlayers || []);
  const [loading, setLoading] = useState(!initialPlayers || initialPlayers.length === 0);

  useEffect(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      setPlayersList(initialPlayers);
      setLoading(false);
      return;
    }

    async function loadStats() {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*');

        if (!error && data) {
          const transformed = (data as SupabasePlayerRow[]).map(transformSupabasePlayer);
          setPlayersList(transformed);
        }
      } catch (err) {
        console.debug('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [initialPlayers]);

  const stats = useMemo(() => {
    let rigNiu = 0;
    let freeAgents = 0;
    const youthClubCounts: Record<string, number> = {};

    playersList.forEach((p) => {
      // RIG / NIU check
      const acad = (p.academyType || '').toUpperCase();
      if (acad === 'RIG' || acad === 'NIU') {
        rigNiu += 1;
      }

      // Contract status check
      if (
        p.contractStatus === 'free_agent' ||
        p.currentStatus === 'available_free_agent' ||
        p.currentStatus === 'seeking_26_27'
      ) {
        freeAgents += 1;
      }

      // Youth club aggregation
      if (p.youthClub && p.youthClub.trim()) {
        const cleanClub = p.youthClub.trim();
        youthClubCounts[cleanClub] = (youthClubCounts[cleanClub] || 0) + 1;
      }
    });

    const sortedYouthClubs = Object.entries(youthClubCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      total: playersList.length,
      rigNiu,
      freeAgents,
      topYouthClubs: sortedYouthClubs,
    };
  }, [playersList]);

  if (loading && playersList.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs my-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Section Title & Live Indicator */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'sv' ? 'Bandyprospects Databas & Nätverk' : 'Bandyprospects Live Network'}</span>
          </div>
          <h3 className="text-base font-extrabold text-zinc-950 tracking-tight">
            {lang === 'sv' ? 'Strukturerad bandystatistik' : 'Structured Bandy Prospect Insights'}
          </h3>
        </div>

        {/* Center / Right: The 3 Core Stats Requested */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
          {/* Stat 1: RIG / NIU */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-base shrink-0">
              🎓
            </div>
            <div>
              <span className="text-lg font-extrabold text-zinc-950 leading-none block">
                {stats.rigNiu}
              </span>
              <span className="text-[11px] text-zinc-600 font-medium leading-tight block mt-0.5">
                {lang === 'sv' ? 'med RIG/NIU-bakgrund' : 'with RIG/NIU Academy'}
              </span>
            </div>
          </div>

          {/* Stat 2: Free Agents */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-base shrink-0">
              🔓
            </div>
            <div>
              <span className="text-lg font-extrabold text-zinc-950 leading-none block">
                {stats.freeAgents}
              </span>
              <span className="text-[11px] text-zinc-600 font-medium leading-tight block mt-0.5">
                {lang === 'sv' ? 'kontraktslösa sökbara spelare' : 'searchable free agents'}
              </span>
            </div>
          </div>

          {/* Stat 3: Top Youth Clubs */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-base shrink-0">
              🌱
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider leading-none">
                {lang === 'sv' ? 'Flest moderklubbar' : 'Top Youth Clubs'}
              </span>
              {stats.topYouthClubs.length > 0 ? (
                <div className="text-xs font-bold text-zinc-900 truncate mt-1" title={stats.topYouthClubs.map(([club]) => club).join(', ')}>
                  {stats.topYouthClubs.map(([club], i) => (
                    <span key={club}>
                      {i > 0 && ' • '}
                      {club}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic mt-0.5 block">
                  {lang === 'sv' ? 'Fylls på löpande' : 'Updating live'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BandyNetworkStats;
