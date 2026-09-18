"use client";

import React, { useState, useEffect } from "react";
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
import SocialLinks from "@/components/SocialLinks";
import { formatWish, isValidUuid } from "@/lib/formatters";

export default function ShortlistPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { user, savedPlayerIds, notes, updateNote, removeSaved, clearShortlist } = useShortlist();

  const [savedItems, setSavedItems] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const players = savedItems;

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

  // Safety fallback timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch players for saved IDs
  useEffect(() => {
    async function fetchShortlistedPlayers() {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("shortlist") : null;
        let storedIds: string[] = [];

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              if (parsed.length === 0 && (!savedPlayerIds || savedPlayerIds.length === 0)) {
                setSavedItems([]);
                setLoading(false);
                return;
              }
              storedIds = parsed
                .map((item: any) => (typeof item === "string" ? item : item?.id))
                .filter(Boolean);
            } else if (typeof parsed === "string" && parsed.trim()) {
              storedIds = [parsed.trim()];
            }
          } catch {
            storedIds = stored.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }

        // Also check bp_saved_player_ids from local storage
        let bpIds: string[] = [];
        try {
          const bpStored = typeof window !== "undefined" ? localStorage.getItem("bp_saved_player_ids") : null;
          if (bpStored) {
            const parsed = JSON.parse(bpStored);
            if (Array.isArray(parsed)) bpIds = parsed;
          }
        } catch {}

        const allCandidateIds = Array.from(
          new Set([...storedIds, ...bpIds, ...(savedPlayerIds || [])])
        );

        const validIds = allCandidateIds.filter(
          (id) => typeof id === "string" && isValidUuid(id)
        );

        if (!validIds || validIds.length === 0) {
          setSavedItems([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("players")
          .select("*")
          .in("id", validIds);

        if (error) {
          console.error("Error fetching shortlisted players:", error);
          setSavedItems([]);
        } else if (data && data.length > 0) {
          const transformed = (data as SupabasePlayerRow[]).map(transformSupabasePlayer);
          setSavedItems(transformed);
        } else {
          setSavedItems([]);
        }
      } catch (err) {
        console.error("Shortlist fetch error:", err);
        setSavedItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchShortlistedPlayers();
  }, [savedPlayerIds]);

  const handleClearList = async () => {
    const confirmMsg = "Are you sure you want to clear your entire shortlist?";
    if (typeof window !== "undefined" && !window.confirm(confirmMsg)) {
      return;
    }

    try {
      localStorage.removeItem("shortlist");
      localStorage.removeItem("bp_saved_player_ids");
      localStorage.removeItem("bp_saved_player_notes");
      setSavedItems([]);
      setLoading(false);
      setLocalNotes({});
      await clearShortlist();
    } catch (e) {
      console.error("Error clearing shortlist:", e);
    } finally {
      localStorage.removeItem("shortlist");
      setSavedItems([]);
      setLoading(false);
    }
  };

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
      const skillsStr = (p.skills.en || p.skills[lang] || []).join("; ");
      const scoutNote = (localNotes[p.id] || "").replace(/"/g, '""');
      return [
        `"${p.id}"`,
        `"${p.name}"`,
        `"${p.age}"`,
        `"${p.countryName.en || p.countryName[lang] || p.countryCode}"`,
        `"${p.positionName.en || p.positionName[lang] || p.positionCategory}"`,
        `"${p.gripName.en || p.gripName[lang] || p.grip}"`,
        `"${p.previousClub}"`,
        `"${p.statusLabel.en || p.statusLabel[lang] || p.currentStatus}"`,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <Header onOpenContact={openContact} />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-3">
                  <span className="text-sm">⭐</span>
                  <span>Club Tools • Saved Prospects</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <span>My Shortlist</span>
                  <span className="text-base font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800">
                    {players.length}
                  </span>
                </h1>
                <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Your personal shortlist of saved players. Add private scout notes and prepare your roster planning for the upcoming season.
                </p>
              </div>

              {players.length > 0 && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => window.print()}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🖨️</span>
                    <span>Print</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>Export to CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearList}
                    className="bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold border border-slate-300 hover:border-rose-300 px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Clear entire shortlist"
                  >
                    <span>🗑️</span>
                    <span>Clear list</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-16 text-center text-sm text-slate-500">
              <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Loading your shortlist...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && savedItems.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-12 sm:p-16 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto text-3xl">
                ⭐
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                No saved players found
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Your shortlist is currently empty. Explore the directory to find and save prospects with private notes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/players"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <span>🔍 Browse Prospects Directory →</span>
                </Link>

                <button
                  type="button"
                  onClick={handleClearList}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>🗑️</span>
                  <span>Clear list</span>
                </button>
              </div>
            </div>
          )}

          {/* Player Cards Grid */}
          {!loading && savedItems.length > 0 && (
            <div className="space-y-6">
              {players.map((player) => {
                const noteStatus = saveNoteStatus[player.id] || "idle";

                return (
                  <div
                    key={player.id}
                    className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-7 shadow-sm hover:border-slate-300 transition-colors"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Player Basic Info (5 cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-slate-900 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0 overflow-hidden border border-slate-200 relative">
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
                                className="text-lg font-bold text-slate-900 hover:underline"
                              >
                                {player.name}
                              </Link>
                              {player.verified && (
                                <span className="text-slate-900" title="Verified Member">
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
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{player.countryFlag}</span>
                              <span>
                                {player.countryName.en || player.countryName[lang]} • {player.age} yrs
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                {player.statusLabel.en || player.statusLabel[lang]}
                              </span>
                              {(player.packagePreference || player.packagePreferenceLabel) && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">
                                  {formatWish(player.packagePreference) || player.packagePreferenceLabel?.en}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Athletic details */}
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Position
                            </span>
                            <span className="font-bold text-slate-900">{player.positionName.en || player.positionName[lang]}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Grip
                            </span>
                            <span className="font-bold text-slate-900">{player.gripName.en || player.gripName[lang]}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Club
                            </span>
                            <span className="font-bold text-slate-900 truncate block">
                              {player.previousClub}
                            </span>
                          </div>
                        </div>

                        {/* Key Attributes */}
                        {(player.skills.en || player.skills[lang]) && (player.skills.en || player.skills[lang]).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(player.skills.en || player.skills[lang]).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Social Links */}
                        <SocialLinks
                          instagramUrl={player.instagramUrl}
                          youtubeUrl={player.youtubeUrl}
                          tiktokUrl={player.tiktokUrl}
                        />
                      </div>

                      {/* Right: Private Scout Notes & Actions (7 cols) */}
                      <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
                        {/* Internal Scout Notes */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>📝</span>
                              <span>Private Scout Notes</span>
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {noteStatus === "saving" && "Saving..."}
                              {noteStatus === "saved" && "✓ Saved"}
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            value={localNotes[player.id] || ""}
                            onChange={(e) => handleNoteChange(player.id, e.target.value)}
                            onBlur={() => handleSaveNote(player.id)}
                            placeholder="Write your private evaluation notes here (e.g. scouting observations, contract expectation, contact status)..."
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                          />

                          <div className="flex justify-end mt-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveNote(player.id)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                            >
                              Save note
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/players/${player.id}`}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors"
                            >
                              {t.playersPage?.viewProfileBtn || "View Profile"} →
                            </Link>

                            <button
                              onClick={() => openContact(player.name, player.email, player.id)}
                              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              {t.playersPage?.contactBtn || "Contact"}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              await removeSaved(player.id);
                              setSavedItems((prev) => prev.filter((p) => p.id !== player.id));
                              try {
                                const stored = localStorage.getItem("shortlist");
                                if (stored) {
                                  const parsed = JSON.parse(stored);
                                  if (Array.isArray(parsed)) {
                                    const next = parsed.filter(
                                      (item: any) => (typeof item === "string" ? item : item?.id) !== player.id
                                    );
                                    localStorage.setItem("shortlist", JSON.stringify(next));
                                  }
                                }
                              } catch {}
                            }}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>🗑️</span>
                            <span>Remove from shortlist</span>
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
