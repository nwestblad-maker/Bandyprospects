"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer id="about" className="bg-zinc-900 text-zinc-400 text-xs border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white text-zinc-900 font-bold text-xs flex items-center justify-center">
                BP
              </div>
              <span className="text-sm font-bold text-white tracking-tight">{t.brand}</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">{t.footer.description}</p>
          </div>

          {/* Column: For Players */}
          <div>
            <div className="font-bold text-zinc-200 uppercase tracking-wider mb-3">
              {t.footer.forPlayers}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/players" className="hover:text-white transition-colors">
                  {t.footer.createProfile}
                </Link>
              </li>
              <li>
                <Link href="/market" className="hover:text-white transition-colors">
                  {t.footer.browseClubs}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  {t.footer.tryouts}
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  {t.footer.careerRelocation}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: For Clubs */}
          <div>
            <div className="font-bold text-zinc-200 uppercase tracking-wider mb-3">
              {t.footer.forClubs}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/market" className="hover:text-white transition-colors">
                  {t.footer.postOpportunity}
                </Link>
              </li>
              <li>
                <Link href="/players" className="hover:text-white transition-colors">
                  {t.footer.scoutDatabase}
                </Link>
              </li>
              <li>
                <Link href="/market" className="hover:text-white transition-colors">
                  {t.footer.clubVerification}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Leagues */}
          <div>
            <div className="font-bold text-zinc-200 uppercase tracking-wider mb-3">
              {t.footer.leagues}
            </div>
            <ul className="space-y-2">
              <li>🇸🇪 Elitserien & Bandyallsvenskan</li>
              <li>🇫🇮 Bandyliiga</li>
              <li>🇳🇴 Eliteserien Norge</li>
              <li>🇳🇱 Dutch 1e Klasse</li>
              <li>🇺🇸 USA Bandy Premier League</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500">
          <div>
            © {new Date().getFullYear()} Bandyprospects. {t.footer.copyright}
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-400">
              {t.footer.privacy}
            </a>
            <a href="#" className="hover:text-zinc-400">
              {t.footer.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
