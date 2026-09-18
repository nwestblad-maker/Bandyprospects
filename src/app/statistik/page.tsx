'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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

    // 1. Sports Academy & NIU stats
    let niuCount = 0;
    let intlAcademyCount = 0;
    const academySchools: Record<string, number> = {};

    // 2. Free Agents & Contract Status
    let freeAgentsCount = 0;
    let seekingCount = 0;

    // 3. Origin / Youth clubs
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

      // Sports Academy / NIU
      const acad = (p.academyType || '').toUpperCase();
      if (acad === 'NIU' || acad.includes('NIU') || acad === 'RIG') {
        niuCount += 1;
      } else if (acad.includes('INTERNATIONAL') || acad.includes('SPORT') || acad.includes('LOCAL')) {
        intlAcademyCount += 1;
      }

      if (p.academySchool && p.academySchool.trim()) {
        const school = p.academySchool.trim();
        academySchools[school] = (academySchools[school] || 0) + 1;
      }

      // Origin / Youth Clubs
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

      // League / Division
      let leagueName = 'Other / Youth';
      if (p.careerHistory && p.careerHistory.length > 0) {
        const latestStint = p.careerHistory[0];
        if (latestStint.league && latestStint.league.trim()) {
          leagueName = latestStint.league.trim();
        }
      } else if (p.previousClub) {
        leagueName = 'Registered Club';
      }

      if (!leagueCounts[leagueName]) {
        leagueCounts[leagueName] = { total: 0, freeAgent: 0 };
      }
      leagueCounts[leagueName].total += 1;
      if (isFreeAgent) {
        leagueCounts[leagueName].freeAgent += 1;
      }
    });

    // Total Academy combined
    const totalAcademy = niuCount + intlAcademyCount;
    const academyPercentage =
      totalPlayers > 0 ? Math.round((totalAcademy / totalPlayers) * 100) : 0;

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

    const positionLabels: Record<PositionCategory, string> = {
      goalkeeper: 'Goalkeepers',
      defender: 'Defenders',
      halv: 'Halvs',
      midfielder: 'Midfielders',
      forward: 'Forwards',
    };

    const positionList: PositionStatItem[] = (
      ['goalkeeper', 'defender', 'halv', 'midfielder', 'forward'] as PositionCategory[]
    ).map((key) => {
      const c = posCounts[key] || { total: 0, freeAgent: 0 };
      return {
        key,
        label: positionLabels[key],
        count: c.total,
        freeAgentCount: c.freeAgent,
        percentage:
          totalPlayers > 0 ? Math.round((c.total / totalPlayers) * 100) : 0,
      };
    });

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
      totalAcademy,
      niuCount,
      intlAcademyCount,
      academyPercentage,
      academySchools,
      freeAgentsCount,
      seekingCount,
      totalWithYouthClub,
      sortedYouthClubs,
      positionList,
      leagueList,
    };
  }, [players, clubAds]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-slate-500">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-slate-800">
              Statistics & Insights
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Bandy Prospects Data & Insights</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Statistics & Insights
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Real-time statistics and structured overview of registered player profiles, active club roster postings, contract statuses, youth academies, and certified high schools.
          </p>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-12">
          {/* KPI 1: Players */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Players
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold">
                  👥
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? '—' : stats.totalPlayers}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  active profiles
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Verified prospects
              </span>
              <Link
                href="/players"
                className="font-bold text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <span>Scout</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* KPI 2: Club Ads */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Club Opportunities
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold">
                  📢
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? '—' : stats.totalClubAds}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  open roster spots
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Clubs & leagues
              </span>
              <Link
                href="/market"
                className="font-bold text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <span>View all</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* KPI 3: Sports Academy / NIU */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bandy Academy / NIU
                </span>
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold">
                  🎓
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? '—' : stats.totalAcademy}
                </span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {stats.academyPercentage}%
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>
                {stats.niuCount} NIU • {stats.intlAcademyCount} International / Other
              </span>
              <span className="font-medium text-slate-700">
                Sports Academy
              </span>
            </div>
          </div>

          {/* KPI 4: Free Agents & Seekers */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Free Agents / Seeking
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-bold">
                  🔓
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? '—' : stats.freeAgentsCount + stats.seekingCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  open for contact
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>
                {stats.freeAgentsCount} Free Agent • {stats.seekingCount} Seeking
              </span>
              <Link
                href="/players"
                className="font-bold text-slate-900 hover:text-emerald-600 transition-colors"
              >
                Filter
              </Link>
            </div>
          </div>
        </div>

        {/* Section 1 & 2 Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 sm:mb-12">
          {/* Origin / Youth Clubs & Nurseries */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Grassroots & Development
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Origin / Youth Clubs
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                {stats.sortedYouthClubs.length} clubs registered
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading youth clubs...
              </div>
            ) : stats.sortedYouthClubs.length > 0 ? (
              <div className="space-y-3">
                {stats.sortedYouthClubs.map((club, idx) => (
                  <div
                    key={club.name}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {club.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 shrink-0 ml-2">
                            {club.count} {club.count === 1 ? 'player' : 'players'}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
                    Youth clubs are specified by players when creating a profile. This ranking updates live as more prospects join the network.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-3">
                <span className="text-2xl">🌱</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Origin / Youth clubs are continually added
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  As players specify their youth clubs, leading developer clubs will be ranked here live.
                </p>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Add your youth club
                </Link>
              </div>
            )}
          </div>

          {/* Kontraktslösa spelare per position & division */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Player Market
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Free Agents & Seekers by Position
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  {stats.freeAgentsCount + stats.seekingCount} available
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
                        <span className="font-bold text-slate-800">{pos.label}</span>
                        <div className="flex items-center gap-2">
                          {pos.freeAgentCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {pos.freeAgentCount} free
                            </span>
                          )}
                          <span className="font-semibold text-slate-900 w-8 text-right">
                            {pos.count}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
                <div className="pt-5 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                    Distribution by League / Level
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {stats.leagueList.map((lg) => (
                      <span
                        key={lg.name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200/80"
                      >
                        <span className="font-bold text-slate-950">{lg.name}:</span>
                        <span>{lg.count}</span>
                        {lg.freeAgentCount > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {lg.freeAgentCount} free
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Updates in real-time as profiles edit
              </span>
              <Link
                href="/players"
                className="font-bold text-slate-950 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <span>View all players</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Section 3: Bandy Academy & NIU High Schools Detailed Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-8 sm:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Certified Sports Academies
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Bandy Academy & NIU High Schools
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Certified secondary bandy programs via Nationally Approved Sports Programs (NIU) and international sports academies.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-center min-w-[90px]">
                <span className="text-xs text-indigo-800 font-bold block uppercase tracking-wider text-[10px]">
                  NIU Players
                </span>
                <span className="text-xl font-extrabold text-indigo-950">
                  {stats.niuCount}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-center min-w-[90px]">
                <span className="text-xs text-indigo-800 font-bold block uppercase tracking-wider text-[10px]">
                  Total Academy
                </span>
                <span className="text-xl font-extrabold text-indigo-950">
                  {stats.totalAcademy}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-sm">
                <span>🏫</span>
                <span>NIU Programs</span>
              </div>
              <p>
                Nationally approved sports education (NIU) certified programs in premier bandy hubs such as Edsbyn, Sandviken, Nässjö, Vetlanda, Västerås, Ljusdal, Bollnäs, and Lidköping.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-sm">
                <span>🌍</span>
                <span>Sports Academies (International)</span>
              </div>
              <p>
                Secondary sports academies across Scandinavia and international bandy nations combining secondary education with elite bandy training.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-sm">
                <span>📈</span>
                <span>Database Share</span>
              </div>
              <p>
                {stats.academyPercentage}% of all registered prospect profiles have verified sports academy or NIU secondary background.
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Callout / Professional Growth State */}
        <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Updated Network</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Help Shape Bandy Prospect Insights for 2026/27
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              All statistics are dynamically extracted from verified player profiles and club opportunity listings on Bandy Prospects.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/join"
                className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Create Player Profile</span>
              </Link>
              <Link
                href="/post-ad"
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors border border-slate-700 inline-flex items-center gap-1.5"
              >
                <span>📢</span>
                <span>Post Club Ad</span>
              </Link>
              <Link
                href="/players"
                className="bg-transparent hover:bg-slate-800 text-slate-300 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>Scout Players</span>
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
