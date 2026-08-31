"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactModal } from "@/components/ContactModal";
import { useLanguage } from "@/context/LanguageContext";
import { useShortlist } from "@/context/ShortlistContext";
import { supabase } from "@/lib/supabaseClient";
import { transformSupabasePlayer, SupabasePlayerRow } from "@/lib/dataMappers";
import { PlayerProfile } from "@/types";
import { formatWish } from "@/lib/formatters";

export default function ShortlistPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { user, savedPlayerIds, notes, updateNote, removeSaved, loading: loadingShortlist } = useShortlist();

  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [saveNoteStatus, setSaveNoteStatus] = useState<Record<string, "idle" | "saving" | "saved">>({});

  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    targetName: string;
    targetEmail?: string;
    targetId?: string;
    type: "club" | "player";
  }>({
    isOpen: false,
    targetName: "",
    type: "player",
  });

  // Auth redirect
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      }
    });
  }, [router]);

  // Sync notes from context
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  // Fetch players for saved IDs
  useEffect(() => {
    async function fetchShortlistedPlayers() {
      if (savedPlayerIds.length === 0) {
        setPlayers([]);
        setLoadingDb(false);
        return;
      }

      try {
        setLoadingDb(true);
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .in("id", savedPlayerIds);

        if (error) {
          console.error("Error fetching shortlisted players:", error);
          setPlayers([]);
        } else if (data) {
          const transformed = (data as SupabasePlayerRow[]).map(transformSupabasePlayer);
          setPlayers(transformed);
        }
      } catch (err) {
        console.error("Shortlist fetch error:", err);
      } finally {
        setLoadingDb(false);
      }
    }

    fetchShortlistedPlayers();
  }, [savedPlayerIds]);

  const handleNoteChange = (playerId: string, value: string) => {
    setLocalNotes((prev) => ({ ...prev, [playerId]: value }));
  };

  const handleSaveNote = async (playerId: string) => {
    setSaveNoteStatus((prev) => ({ ...prev, [playerId]: "saving" }));
    const noteText = localNotes[playerId] || "";
    await updateNote(playerId, noteText);
    setSaveNoteStatus((prev) => ({ ...prev, [playerId]: "saved" }));
    setTimeout(() => {
      setSaveNoteStatus((prev) => ({ ...prev, [playerId]: "idle" }));
    }, 2000);
  };

  const handleExportCSV = () => {
    if (players.length === 0) return;

    const headers = [
      "ID",
      "Full Name",
      "Age",
      "Nationality",
      "Position",
      "Grip",
      "Current Club",
      "Status",
      "Key Attributes",
      "Scout Notes",
    ];

    const rows = players.map((p) => {
      const skillsStr = (p.skills[lang] || []).join("; ");
      const scoutNote = (localNotes[p.id] || "").replace(/"/g, '""');
      return [
        `"${p.id}"`,
        `"${p.name}"`,
        `"${p.age}"`,
        `"${p.countryName[lang]}"`,
        `"${p.positionName[lang]}"`,
        `"${p.gripName[lang]}"`,
        `"${p.previousClub}"`,
        `"${p.statusLabel[lang]}"`,
        `"${skillsStr}"`,
        `"${scoutNote}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bandyprospects_shortlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openContact = (targetName: string, targetEmail?: string, targetId?: string) => {
    setContactModal({
      isOpen: true,
      targetName,
      targetEmail,
      targetId,
      type: "player",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-zinc-50">
      <Header onOpenContact={openContact} />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-3">
                  <span className="text-sm">⭐</span>
                  <span>
                    {lang === "sv"
                      ? "Klubbverktyg • Sparade kandidater"
                      : "Club Tools • Saved Prospects"}
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-3">
                  <span>{lang === "sv" ? "Min Shortlist" : "My Shortlist"}</span>
                  <span className="text-base font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800">
                    {players.length}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                  {lang === "sv"
                    ? "Din personliga lista över sparade spelare. Skriv interna anteckningar och förbered din klubbs scouting inför säsongen 26/27."
                    : "Your personal shortlist of saved players. Add private scout notes and prepare your roster planning for season 26/27."}
                </p>
              </div>

              {players.length > 0 && (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🖨️</span>
                    <span>{lang === "sv" ? "Skriv ut" : "Print"}</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>{lang === "sv" ? "Exportera till CSV" : "Export to CSV"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading */}
          {(loadingDb || loadingShortlist) && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center text-xs text-zinc-500">
              <div className="w-7 h-7 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Laddar din shortlist...</span>
            </div>
          )}

          {/* Empty State */}
          {!loadingDb && !loadingShortlist && players.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 sm:p-16 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto mb-4 text-3xl">
                ⭐
              </div>
              <h2 className="text-xl font-bold text-zinc-950 mb-2">
                {lang === "sv" ? "Din shortlist är tom" : "Your shortlist is empty"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed">
                {lang === "sv"
                  ? "Du har inte sparat några spelare än. Bläddra bland registrerade profiler och klicka på stjärnikonen för att samla dina favoritkandidater här."
                  : "You haven't saved any players yet. Browse through verified prospect profiles and click the star icon to bookmark prospects."}
              </p>
              <Link
                href="/players"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>🔍 {lang === "sv" ? "Bläddra bland spelare" : "Browse Players"} →</span>
              </Link>
            </div>
          )}

          {/* Player Cards Grid */}
          {!loadingDb && !loadingShortlist && players.length > 0 && (
            <div className="space-y-6">
              {players.map((player) => {
                const noteStatus = saveNoteStatus[player.id] || "idle";

                return (
                  <div
                    key={player.id}
                    className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-zinc-300 transition-colors"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Player Basic Info (5 cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-zinc-900 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0 overflow-hidden border border-zinc-200 relative">
                            {player.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{player.avatarInitials}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/players/${player.id}`}
                                className="text-lg font-bold text-zinc-950 hover:underline"
                              >
                                {player.name}
                              </Link>
                              {player.verified && (
                                <span className="text-zinc-900" title="Verified Member">
                                  <svg className="w-4 h-4 inline" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              <span>{player.countryFlag}</span>
                              <span>
                                {player.countryName[lang]} • {player.age} år
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                                {player.statusLabel[lang]}
                              </span>
                              {(player.packagePreference || player.packagePreferenceLabel) && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">
                                  {formatWish(player.packagePreference) || player.packagePreferenceLabel?.[lang]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Athletic details */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                          <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                              Position
                            </span>
                            <span className="font-bold text-zinc-900">{player.positionName[lang]}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                              Fattning
                            </span>
                            <span className="font-bold text-zinc-900">{player.gripName[lang]}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                              Klubb
                            </span>
                            <span className="font-bold text-zinc-900 truncate block">
                              {player.previousClub}
                            </span>
                          </div>
                        </div>

                        {/* Key Attributes */}
                        {player.skills[lang] && player.skills[lang].length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {player.skills[lang].map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-[11px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Private Scout Notes & Actions (7 cols) */}
                      <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
                        {/* Internal Scout Notes */}
                        <div className="bg-zinc-50/70 border border-zinc-200 rounded-xl p-3.5">
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                              <span>📝</span>
                              <span>{lang === "sv" ? "Interna scoutanteckningar (Privat)" : "Private Scout Notes"}</span>
                            </label>
                            <span className="text-[10px] text-zinc-400">
                              {noteStatus === "saving" && "Sparar..."}
                              {noteStatus === "saved" && "✓ Sparad"}
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            value={localNotes[player.id] || ""}
                            onChange={(e) => handleNoteChange(player.id, e.target.value)}
                            onBlur={() => handleSaveNote(player.id)}
                            placeholder={
                              lang === "sv"
                                ? "Skriv dina interna anteckningar om spelaren här (t.ex. scoutobservationer, löneanspråk, kontaktstatus)..."
                                : "Write your private evaluation notes here..."
                            }
                            className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-2xs"
                          />

                          <div className="flex justify-end mt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveNote(player.id)}
                              className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-950 underline cursor-pointer"
                            >
                              {lang === "sv" ? "Spara anteckning" : "Save note"}
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/players/${player.id}`}
                              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs"
                            >
                              {t.playersPage.viewProfileBtn} →
                            </Link>

                            <button
                              onClick={() => openContact(player.name, player.email, player.id)}
                              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                            >
                              {t.playersPage.contactBtn}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSaved(player.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>🗑️</span>
                            <span>{lang === "sv" ? "Ta bort från shortlist" : "Remove from shortlist"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ ...contactModal, isOpen: false })}
        targetName={contactModal.targetName}
        targetEmail={contactModal.targetEmail}
        targetId={contactModal.targetId}
        type={contactModal.type}
      />

      <Footer />
    </div>
  );
}
