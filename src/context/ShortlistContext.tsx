"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ShortlistContextType {
  user: { id: string; email?: string } | null;
  savedPlayerIds: string[];
  notes: Record<string, string>;
  isSaved: (playerId: string) => boolean;
  toggleSave: (playerId: string) => Promise<{ success: boolean; requiresAuth?: boolean; saved?: boolean }>;
  removeSaved: (playerId: string) => Promise<void>;
  updateNote: (playerId: string, noteText: string) => Promise<void>;
  shortlistCount: number;
  loading: boolean;
  refreshShortlist: () => Promise<void>;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "bp_saved_player_ids";
const LOCAL_STORAGE_NOTES_KEY = "bp_saved_player_notes";

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [savedPlayerIds, setSavedPlayerIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load from local storage initially
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedPlayerIds(JSON.parse(stored));
      }
      const storedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (e) {
      console.warn("Could not read local shortlist:", e);
    }
  }, []);

  const loadUserDataAndShortlist = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("saved_players")
        .select("id, player_id, notes, created_at")
        .eq("user_id", userId);

      if (error) {
        console.warn("Could not fetch saved_players from Supabase:", error.message);
        return;
      }

      if (data) {
        const ids: string[] = [];
        const notesMap: Record<string, string> = {};

        data.forEach((item: { player_id: string; notes?: string }) => {
          if (item.player_id) {
            ids.push(item.player_id);
            if (item.notes) {
              notesMap[item.player_id] = item.notes;
            }
          }
        });

        setSavedPlayerIds(ids);
        setNotes((prev) => ({ ...prev, ...notesMap }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
        localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify({ ...notes, ...notesMap }));
      }
    } catch (err) {
      console.warn("Error loading shortlist:", err);
    } finally {
      setLoading(false);
    }
  }, [notes]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setUser({ id: u.id, email: u.email });
        loadUserDataAndShortlist(u.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email });
        loadUserDataAndShortlist(u.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserDataAndShortlist]);

  const isSaved = useCallback(
    (playerId: string) => {
      return savedPlayerIds.includes(playerId);
    },
    [savedPlayerIds]
  );

  const toggleSave = async (playerId: string): Promise<{ success: boolean; requiresAuth?: boolean; saved?: boolean }> => {
    if (!user) {
      return { success: false, requiresAuth: true };
    }

    const currentlySaved = isSaved(playerId);

    if (currentlySaved) {
      // Remove
      const nextIds = savedPlayerIds.filter((id) => id !== playerId);
      setSavedPlayerIds(nextIds);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextIds));

      try {
        await supabase
          .from("saved_players")
          .delete()
          .eq("user_id", user.id)
          .eq("player_id", playerId);
      } catch (err) {
        console.error("Failed to delete saved player in DB:", err);
      }

      return { success: true, saved: false };
    } else {
      // Add
      const nextIds = [...savedPlayerIds, playerId];
      setSavedPlayerIds(nextIds);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextIds));

      try {
        await supabase.from("saved_players").insert({
          user_id: user.id,
          player_id: playerId,
          notes: notes[playerId] || null,
        });
      } catch (err) {
        console.error("Failed to insert saved player in DB:", err);
      }

      return { success: true, saved: true };
    }
  };

  const removeSaved = async (playerId: string) => {
    const nextIds = savedPlayerIds.filter((id) => id !== playerId);
    setSavedPlayerIds(nextIds);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextIds));

    if (user) {
      try {
        await supabase
          .from("saved_players")
          .delete()
          .eq("user_id", user.id)
          .eq("player_id", playerId);
      } catch (err) {
        console.error("Failed to remove saved player:", err);
      }
    }
  };

  const updateNote = async (playerId: string, noteText: string) => {
    const nextNotes = { ...notes, [playerId]: noteText };
    setNotes(nextNotes);
    localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(nextNotes));

    if (user) {
      try {
        // Upsert or update note
        await supabase
          .from("saved_players")
          .update({ notes: noteText })
          .eq("user_id", user.id)
          .eq("player_id", playerId);
      } catch (err) {
        console.error("Failed to update note in DB:", err);
      }
    }
  };

  const refreshShortlist = async () => {
    if (user) {
      await loadUserDataAndShortlist(user.id);
    }
  };

  return (
    <ShortlistContext.Provider
      value={{
        user,
        savedPlayerIds,
        notes,
        isSaved,
        toggleSave,
        removeSaved,
        updateNote,
        shortlistCount: savedPlayerIds.length,
        loading,
        refreshShortlist,
      }}
    >
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const context = useContext(ShortlistContext);
  if (!context) {
    throw new Error("useShortlist must be used within a ShortlistProvider");
  }
  return context;
}
