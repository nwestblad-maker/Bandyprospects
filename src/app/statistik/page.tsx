'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { PlayerProfile, ClubAd, PositionCategory } from '@/types';
import {
  SupabasePlayerRow,
  SupabaseClubAdRow,
  transformSupabasePlayer,
  transformSupabaseClubAd,
} from '@/lib/dataMappers';

interface YouthClubItem {
  name: string;
  count: number;
  percentage: number;
}

interface PositionStatItem {
  key: PositionCategory;
  label: string;
  count: number;
  freeAgentCount: number;
  percentage: number;
}

interface LeagueStatItem {
  name: string;
  count: number;
  freeAgentCount: number;
}

export default function StatisticsPage() {
  const { lang } = useLanguage();

  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [clubAds, setClubAds] = useState<ClubAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // 1. Fetch Players
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .order('created_at', { ascending: false });

        if (!playerError && playerData) {
          const transformed = (playerData as SupabasePlayerRow[]).map(
            transformSupabasePlayer
          );
          setPlayers(transformed);
        }

        // 2. Fetch Club Ads
        const { data: clubData, error: clubError } = await supabase
          .from('club_ads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!clubError && clubData) {
          const transformedClubs = (clubData as SupabaseClubAdRow[]).map(
            transformSupabaseClubAd
          );
          setClubAds(transformedClubs);
        }
      } catch (err) {
        console.error('Failed to load statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Aggregated Dynamic Calculations
  const stats = useMemo(() => {
    const totalPlayers = players.length;
    const totalClubAds = clubAds.length;

    // 1. RIG / NIU Academy stats
    let rigCount = 0;
    let niuCount = 0;
    const academySchools: Record<string, number> = {};

    // 2. Free Agents & Contract Status
    let freeAgentsCount = 0;
    let seekingCount = 0;

    // 3. Youth clubs
    const youthClubCounts: Record<string, number> = {};
    let totalWithYouthClub = 0;

    // 4. Position Breakdown
    const posCounts: Record<PositionCategory, { total: number; freeAgent: number }> = {
      goalkeeper: { total: 0, freeAgent: 0 },
      defender: { total: 0, freeAgent: 0 },
      halv: { total: 0, freeAgent: 0 },
      midfielder: { total: 0, freeAgent: 0 },
      forward: { total: 0, freeAgent: 0 },
    };

    // 5. League / Division Breakdown
    const leagueCounts: Record<string, { total: number; freeAgent: number }> = {};

    players.forEach((p) => {
      // Free agent detection
      const isFreeAgent =
        p.contractStatus === 'free_agent' ||
        p.currentStatus === 'available_free_agent' ||
        p.currentStatus === 'seeking_26_27';

      if (
        p.contractStatus === 'free_agent' ||
        p.currentStatus === 'available_free_agent'
      ) {
        freeAgentsCount += 1;
      }
      if (p.currentStatus === 'seeking_26_27') {
        seekingCount += 1;
      }

      // RIG / NIU
      const acad = (p.academyType || '').toUpperCase();
      if (acad === 'RIG') {
        rigCount += 1;
      } else if (acad === 'NIU') {
        niuCount += 1;
      }

      if (p.academySchool && p.academySchool.trim()) {
        const school = p.academySchool.trim();
        academySchools[school] = (academySchools[school] || 0) + 1;
      }

      // Youth Clubs
      if (p.youthClub && p.youthClub.trim()) {
        const yClub = p.youthClub.trim();
        youthClubCounts[yClub] = (youthClubCounts[yClub] || 0) + 1;
        totalWithYouthClub += 1;
      }

      // Positions
      const pos = p.positionCategory;
      if (pos && posCounts[pos]) {
        posCounts[pos].total += 1;
        if (isFreeAgent) {
          posCounts[pos].freeAgent += 1;
        }
      }

      // League / Division (from latest career history stint or previous club)
      let leagueName = 'Övrigt / Ungdom';
      if (p.careerHistory && p.careerHistory.length > 0) {
        const latestStint = p.careerHistory[0];
        if (latestStint.league && latestStint.league.trim()) {
          leagueName = latestStint.league.trim();
        }
      } else if (p.previousClub) {
        leagueName = 'Registrerad klubb';
      }

      if (!leagueCounts[leagueName]) {
        leagueCounts[leagueName] = { total: 0, freeAgent: 0 };
      }
      leagueCounts[leagueName].total += 1;
      if (isFreeAgent) {
        leagueCounts[leagueName].freeAgent += 1;
      }
    });

    // Total RIG/NIU combined
    const totalRigNiu = rigCount + niuCount;
    const rigNiuPercentage =
      totalPlayers > 0 ? Math.round((totalRigNiu / totalPlayers) * 100) : 0;

    // Sort youth clubs
    const sortedYouthClubs: YouthClubItem[] = Object.entries(youthClubCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          totalWithYouthClub > 0
            ? Math.round((count / totalWithYouthClub) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Positions format
    const positionLabels: Record<PositionCategory, { sv: string; en: string }> = {
      goalkeeper: { sv: 'Målvakter', en: 'Goalkeepers' },
      defender: { sv: 'Försvarare / Backar', en: 'Defenders' },
      halv: { sv: 'Halvor', en: 'Halvs' },
      midfielder: { sv: 'Mittfältare', en: 'Midfielders' },
      forward: { sv: 'Anfallare', en: 'Forwards' },
    };

    const positionList: PositionStatItem[] = (
      ['goalkeeper', 'defender', 'halv', 'midfielder', 'forward'] as PositionCategory[]
    ).map((key) => {
      const c = posCounts[key] || { total: 0, freeAgent: 0 };
      return {
        key,
        label: lang === 'sv' ? positionLabels[key].sv : positionLabels[key].en,
        count: c.total,
        freeAgentCount: c.freeAgent,
        percentage:
          totalPlayers > 0 ? Math.round((c.total / totalPlayers) * 100) : 0,
      };
    });

    // League format sorted by total
    const leagueList: LeagueStatItem[] = Object.entries(leagueCounts)
      .map(([name, data]) => ({
        name,
        count: data.total,
        freeAgentCount: data.freeAgent,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalPlayers,
      totalClubAds,
      totalRigNiu,
      rigCount,
      niuCount,
      rigNiuPercentage,
      academySchools,
      freeAgentsCount,
      seekingCount,
      totalWithYouthClub,
      sortedYouthClubs,
      positionList,
      leagueList,
    };
  }, [players, clubAds, lang]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-zinc-500">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-zinc-900 transition-colors">
                {lang === 'sv' ? 'Hem' : 'Home'}
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-zinc-800">
              {lang === 'sv' ? 'Statistik & Insikter' : 'Statistics & Insights'}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {lang === 'sv'
                ? 'Bandyprospects Data & Analys'
                : 'Bandyprospects Data & Insights'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
            {lang === 'sv' ? 'Statistik & Insikter' : 'Statistics & Insights'}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-3xl leading-relaxed">
            {lang === 'sv'
              ? 'Realtidsstatistik och strukturerad överblick över registrerade spelarprofiler, aktiva klubbannonser, kontraktsstatus, moderklubbar och certifierade bandygymnasier.'
              : 'Real-time statistics and structured overview of registered player profiles, active club roster postings, contract statuses, youth academies, and certified high schools.'}
          </p>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-12">
          {/* KPI 1: Players */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {lang === 'sv' ? 'Registrerade Spelare' : 'Registered Players'}
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold">
                  👥
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                  {loading ? '—' : stats.totalPlayers}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {lang === 'sv' ? 'aktiva profiler' : 'active profiles'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {lang === 'sv' ? 'Verifierade spelare' : 'Verified prospects'}
              </span>
              <Link
                href="/players"
                className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <span>{lang === 'sv' ? 'Scouta' : 'Scout'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* KPI 2: Club Ads */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {lang === 'sv' ? 'Klubbannonser' : 'Club Opportunities'}
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold">
                  📢
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                  {loading ? '—' : stats.totalClubAds}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {lang === 'sv' ? 'öppna truppbehov' : 'open roster spots'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {lang === 'sv' ? 'Föreningar & ligor' : 'Clubs & leagues'}
              </span>
              <Link
                href="/market"
                className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <span>{lang === 'sv' ? 'Visa alla' : 'View all'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* KPI 3: RIG / NIU */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {lang === 'sv' ? 'RIG / NIU-Bakgrund' : 'RIG / NIU Academy'}
                </span>
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold">
                  🎓
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                  {loading ? '—' : stats.totalRigNiu}
                </span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {stats.rigNiuPercentage}%
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
              <span>
                {stats.rigCount} RIG • {stats.niuCount} NIU
              </span>
              <span className="font-medium text-zinc-700">
                {lang === 'sv' ? 'Bandyutbildning' : 'Academy'}
              </span>
            </div>
          </div>

          {/* KPI 4: Free Agents & Seekers */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {lang === 'sv' ? 'Kontraktslösa / Sökande' : 'Free Agents / Seeking'}
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-bold">
                  🔓
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
                  {loading ? '—' : stats.freeAgentsCount + stats.seekingCount}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {lang === 'sv' ? 'öppna för dialog' : 'open for contact'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between">
              <span>
                {stats.freeAgentsCount} Free Agent • {stats.seekingCount}{' '}
                {lang === 'sv' ? 'Söker' : 'Seeking'}
              </span>
              <Link
                href="/players"
                className="font-bold text-zinc-900 hover:text-emerald-600 transition-colors"
              >
                {lang === 'sv' ? 'Filtrera' : 'Filter'}
              </Link>
            </div>
          </div>
        </div>

        {/* Section 1 & 2 Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 sm:mb-12">
          {/* Moderklubbar & Plantskolor */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  {lang === 'sv' ? 'Plantskolor' : 'Youth Academies'}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 tracking-tight">
                  {lang === 'sv' ? 'Moderklubbar' : 'Youth Clubs'}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-bold">
                {stats.sortedYouthClubs.length}{' '}
                {lang === 'sv' ? 'klubbar registrerade' : 'clubs registered'}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                {lang === 'sv' ? 'Laddar moderklubbar...' : 'Loading youth clubs...'}
              </div>
            ) : stats.sortedYouthClubs.length > 0 ? (
              <div className="space-y-3">
                {stats.sortedYouthClubs.map((club, idx) => (
                  <div
                    key={club.name}
                    className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-zinc-900 truncate">
                            {club.name}
                          </span>
                          <span className="text-xs font-semibold text-zinc-600 shrink-0 ml-2">
                            {club.count}{' '}
                            {lang === 'sv'
                              ? club.count === 1
                                ? 'spelare'
                                : 'spelare'
                              : club.count === 1
                                ? 'player'
                                : 'players'}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(
                                12,
                                Math.min(
                                  100,
                                  (club.count /
                                    (stats.sortedYouthClubs[0]?.count || 1)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
                  <span className="text-base shrink-0">🌱</span>
                  <p className="leading-relaxed">
                    {lang === 'sv'
                      ? 'Moderklubben anges av respektive spelare vid profilregistrering. Listan fylls på automatiskt när fler talanger registrerar sig.'
                      : 'Youth clubs are specified by players when creating a profile. This ranking updates live as more prospects join the network.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-center space-y-3">
                <span className="text-2xl">🌱</span>
                <h3 className="text-sm font-bold text-zinc-900">
                  {lang === 'sv'
                    ? 'Moderklubbar samlas in löpande'
                    : 'Youth clubs are continually added'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  {lang === 'sv'
                    ? 'När aktiva spelare anger sin moderklubb rankas Sveriges och världens bandyplantskolor automatiskt här.'
                    : 'As players specify their youth clubs, the leading developer clubs will be ranked here live.'}
                </p>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-2xs"
                >
                  {lang === 'sv' ? 'Lägg till din moderklubb' : 'Add your youth club'}
                </Link>
              </div>
            )}
          </div>

          {/* Kontraktslösa spelare per position & division */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    {lang === 'sv' ? 'Spelarmarknad' : 'Player Market'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 tracking-tight">
                    {lang === 'sv'
                      ? 'Kontraktslösa & Sökande per position'
                      : 'Free Agents & Seekers by Position'}
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-bold">
                  {stats.freeAgentsCount + stats.seekingCount}{' '}
                  {lang === 'sv' ? 'tillgängliga' : 'available'}
                </span>
              </div>

              {/* Positions List */}
              <div className="space-y-3.5 mb-6">
                {stats.positionList.map((pos) => {
                  const maxCount = Math.max(
                    ...stats.positionList.map((p) => p.count),
                    1
                  );
                  const barWidth = Math.max(
                    8,
                    Math.round((pos.count / maxCount) * 100)
                  );

                  return (
                    <div key={pos.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-800">{pos.label}</span>
                        <div className="flex items-center gap-2">
                          {pos.freeAgentCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {pos.freeAgentCount}{' '}
                              {lang === 'sv' ? 'kontraktslösa' : 'free'}
                            </span>
                          )}
                          <span className="font-semibold text-zinc-900 w-8 text-right">
                            {pos.count} st
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: pos.count > 0 ? `${barWidth}%` : '0%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* League / Level Distribution */}
              {stats.leagueList.length > 0 && (
                <div className="pt-5 border-t border-zinc-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
                    {lang === 'sv'
                      ? 'Fördelning per nivå / senaste liga'
                      : 'Distribution by League / Level'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {stats.leagueList.map((lg) => (
                      <span
                        key={lg.name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-xs font-medium border border-zinc-200/80"
                      >
                        <span className="font-bold text-zinc-950">{lg.name}:</span>
                        <span>{lg.count}</span>
                        {lg.freeAgentCount > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {lg.freeAgentCount} {lang === 'sv' ? 'lediga' : 'free'}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {lang === 'sv'
                  ? 'Uppdateras i realtid vid profiländring'
                  : 'Updates in real-time as profiles edit'}
              </span>
              <Link
                href="/players"
                className="font-bold text-zinc-950 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <span>{lang === 'sv' ? 'Se alla spelare' : 'View all players'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Section 3: RIG & NIU Bandygymnasier Detailed Box */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs mb-8 sm:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-100 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                {lang === 'sv' ? 'Certifierad Elitutbildning' : 'Certified Elite Academies'}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 tracking-tight">
                {lang === 'sv'
                  ? 'RIG / NIU Bandygymnasier'
                  : 'RIG / NIU Bandy High Schools'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl">
                {lang === 'sv'
                  ? 'Svenska Bandyförbundets certifierade utbildningar via Riksidrottsgymnasium (RIG Sandviken) och Nationellt godkända idrottsutbildningar (NIU).'
                  : 'Certified elite bandy secondary programs via National Sports High School (RIG Sandviken) and Nationally Approved Sports Programs (NIU).'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-center min-w-[90px]">
                <span className="text-xs text-indigo-800 font-bold block uppercase tracking-wider text-[10px]">
                  {lang === 'sv' ? 'RIG-spelare' : 'RIG Players'}
                </span>
                <span className="text-xl font-extrabold text-indigo-950">
                  {stats.rigCount}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-center min-w-[90px]">
                <span className="text-xs text-indigo-800 font-bold block uppercase tracking-wider text-[10px]">
                  {lang === 'sv' ? 'NIU-spelare' : 'NIU Players'}
                </span>
                <span className="text-xl font-extrabold text-indigo-950">
                  {stats.niuCount}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-600 leading-relaxed">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <div className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5 text-sm">
                <span>🏫</span>
                <span>RIG Sandviken</span>
              </div>
              <p>
                {lang === 'sv'
                  ? 'Sveriges enda Riksidrottsgymnasium för bandy, beläget vid Bessemerskolan i Sandviken. Riktar sig mot de främsta talangerna nationellt.'
                  : 'Sweden only National Elite Sports High School for bandy, located in Sandviken for elite national prospects.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <div className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5 text-sm">
                <span>🏒</span>
                <span>NIU-Orter</span>
              </div>
              <p>
                {lang === 'sv'
                  ? 'Nationellt godkända idrottsutbildningar i bandymetropoler som Edsbyn, Nässjö, Vetlanda, Västerås, Ljusdal, Bollnäs och Lidköping.'
                  : 'Nationally approved secondary programs located in major bandy centers across Sweden.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <div className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5 text-sm">
                <span>📈</span>
                <span>{lang === 'sv' ? 'Databasandel' : 'Database Share'}</span>
              </div>
              <p>
                {lang === 'sv'
                  ? `${stats.rigNiuPercentage}% av alla registrerade profiler har angivit RIG eller NIU i sin spelarprofil.`
                  : `${stats.rigNiuPercentage}% of all registered prospect profiles have verified RIG or NIU secondary background.`}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Callout / Professional Growth State */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {lang === 'sv' ? 'Realtidsuppdaterat nätverk' : 'Live updated network'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
              {lang === 'sv'
                ? 'Var med och forma statistiken inför säsongen 2026/27'
                : 'Help shape bandy prospect insights for 2026/27'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
              {lang === 'sv'
                ? 'All statistik hämtas direkt och transparent från verifierade spelarprofiler och klubbannonser i Bandyprospects. Skapa din profil eller publicera klubbens truppbehov för att synas i nätverket.'
                : 'All statistics are dynamically extracted from verified player profiles and club opportunity listings on Bandyprospects.'}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/join"
                className="px-4 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                <span>+</span>
                <span>
                  {lang === 'sv' ? 'Skapa spelarprofil' : 'Create Player Profile'}
                </span>
              </Link>
              <Link
                href="/post-ad"
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors border border-zinc-700 inline-flex items-center gap-1.5"
              >
                <span>📢</span>
                <span>
                  {lang === 'sv' ? 'Publicera klubbannons' : 'Post Club Ad'}
                </span>
              </Link>
              <Link
                href="/players"
                className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-zinc-800/80 text-zinc-300 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span>{lang === 'sv' ? 'Scouta spelare' : 'Scout Players'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

