'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export interface OfficialTransfer {
  id: string;
  player_name: string;
  from_club: string;
  to_club: string;
  transfer_date: string;
  sport?: string;
  source?: string;
  created_at?: string;
}

function formatTransferDate(dateStr: string, lang: string): string {
  if (!dateStr) return '';
  try {
    const today = new Date();
    const target = new Date(dateStr);
    
    // Compare YYYY-MM-DD
    const todayISO = today.toISOString().split('T')[0];
    const targetISO = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;

    if (todayISO === targetISO) {
      return lang === 'sv' ? 'Idag' : 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];
    if (yesterdayISO === targetISO) {
      return lang === 'sv' ? 'Igår' : 'Yesterday';
    }

    // Format e.g. "2 sep" or "Sep 2"
    return target.toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export default function LatestTransfersTicker() {
  const { lang } = useLanguage();
  const [transfers, setTransfers] = useState<OfficialTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transfers?limit=25');
      const data = await res.json();
      if (data?.transfers && Array.isArray(data.transfers)) {
        setTransfers(data.transfers);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await fetch('/api/transfers/sync', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setSyncMessage(
          lang === 'sv'
            ? `Synk slutförd: ${data.syncedCount || 0} nya övergångar.`
            : `Sync completed: ${data.syncedCount || 0} new transfers.`
        );
        await fetchTransfers();
      } else {
        setSyncMessage(data?.error || 'Kunde inte slutföra synk.');
      }
    } catch {
      setSyncMessage('Ett fel uppstod vid kontakt med Profixio.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-zinc-950 text-white py-6 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase">
                  {lang === 'sv' ? 'Officiella Övergångar 2026/27' : 'Official Transfers 2026/27'}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {lang === 'sv'
                  ? 'Officiellt bekräftade övergångar via Svenska Bandyförbundet'
                  : 'Officially confirmed transfers via the Swedish Bandy Association'}
              </p>
            </div>
          </div>

          {/* Controls: sync button & horizontal scroll arrows */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {syncMessage && (
              <span className="text-xs text-emerald-400 font-medium animate-in fade-in duration-150">
                {syncMessage}
              </span>
            )}
            <button
              onClick={handleManualSync}
              disabled={syncing}
              title="Synka senaste övergångarna från Profixio / SBF"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={syncing ? 'animate-spin inline-block' : ''}>🔄</span>
              <span className="hidden sm:inline">{syncing ? (lang === 'sv' ? 'Synkar...' : 'Syncing...') : (lang === 'sv' ? 'Synka nu' : 'Sync feed')}</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
                aria-label="Scroll left"
              >
                ◀
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
                aria-label="Scroll right"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Ticker / Horizontal Cards Scroller */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        >
          {loading && transfers.length === 0 ? (
            <div className="py-6 text-xs text-zinc-500 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>{lang === 'sv' ? 'Hämtar officiella övergångar...' : 'Loading official transfers...'}</span>
            </div>
          ) : transfers.length === 0 ? (
            <div className="py-4 text-xs text-zinc-500 italic">
              {lang === 'sv' ? 'Inga övergångar registrerade ännu.' : 'No transfers recorded yet.'}
            </div>
          ) : (
            transfers.map((item) => (
              <div
                key={item.id}
                className="shrink-0 w-72 sm:w-80 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 transition-all snap-start flex flex-col justify-between shadow-2xs group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                    {item.player_name}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                    {formatTransferDate(item.transfer_date, lang)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <div className="flex-1 truncate font-medium text-zinc-400" title={item.from_club}>
                    {item.from_club || 'Okänd klubb'}
                  </div>
                  <span className="text-emerald-500 font-bold text-sm shrink-0">→</span>
                  <div className="flex-1 truncate font-semibold text-white text-right" title={item.to_club}>
                    {item.to_club || 'Okänd klubb'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Source link footer */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Källa:</span>
            <a
              href="https://www.profixio.com/fx/lisens/public_overgang.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white underline font-medium inline-flex items-center gap-1"
            >
              <span>Svenska Bandyförbundet / Profixio</span>
              <span>↗</span>
            </a>
          </div>
          <span className="text-zinc-400">
            {lang === 'sv'
              ? 'Officiell licens- och övergångsdata för svensk bandy'
              : 'Official license and transfer data for Swedish bandy'}
          </span>
        </div>
      </div>
    </section>
  );
}

export { LatestTransfersTicker };
