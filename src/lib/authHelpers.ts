import { supabase } from "@/lib/supabaseClient";

/**
 * Resolves an email address from either an email or a username / club name / player name.
 * If the input already contains an '@', it is cleaned and returned directly.
 * Otherwise, it attempts to find a matching account in user_profiles or players.
 */
export async function resolveEmailFromIdentifier(identifier: string): Promise<string> {
  const clean = identifier.trim();
  if (!clean) return "";

  if (clean.includes("@")) {
    return clean.toLowerCase();
  }

  // 1. Try to find in user_profiles table (for clubs / custom display names)
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email")
      .or(`display_name.ilike.${clean},club_name.ilike.${clean}`)
      .limit(1)
      .maybeSingle();

    if (profile?.email) {
      return profile.email.toLowerCase().trim();
    }
  } catch (err) {
    console.debug("user_profiles lookup error:", err);
  }

  // 2. Try to find in players table
  try {
    const { data: player } = await supabase
      .from("players")
      .select("email")
      .or(`first_name.ilike.${clean},last_name.ilike.${clean}`)
      .limit(1)
      .maybeSingle();

    if (player?.email) {
      return player.email.toLowerCase().trim();
    }
  } catch (err) {
    console.debug("players lookup error:", err);
  }

  // 3. If identifier has two words (first name + last name)
  if (clean.includes(" ")) {
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      try {
        const { data: playerByFullName } = await supabase
          .from("players")
          .select("email")
          .ilike("first_name", parts[0])
          .ilike("last_name", parts.slice(1).join(" "))
          .limit(1)
          .maybeSingle();

        if (playerByFullName?.email) {
          return playerByFullName.email.toLowerCase().trim();
        }
      } catch (err) {
        console.debug("players full name lookup error:", err);
      }
    }
  }

  return clean;
}
