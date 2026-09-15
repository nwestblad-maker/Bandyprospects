export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { supabase as anonSupabase } from "@/lib/supabaseClient";
import { isOfficialClubDomain } from "@/lib/clubVerification";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    // Fallback: check Authorization header if cookies are not present
    let currentUser = authData?.user;
    if (!currentUser) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await anonSupabase.auth.getUser(token);
        if (tokenUser?.user) {
          currentUser = tokenUser.user;
        }
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = currentUser.id;
    const userEmail = currentUser.email?.toLowerCase().trim() || "";

    // 1. Check if user is linked to a player record
    let playerIds: string[] = [];
    try {
      const { data: players } = await anonSupabase
        .from("players")
        .select("id")
        .or(`user_id.eq.${userId},email.ilike.${userEmail}`);
      if (players) {
        playerIds = players.map((p) => p.id);
      }
    } catch (e) {
      console.error("Error looking up player records for user:", e);
    }

    // 2. Fetch conversations where user is either club_user_id or player_id
    let query = anonSupabase.from("conversations").select("*");
    if (playerIds.length > 0) {
      const playerFilter = playerIds.map((id) => `player_id.eq.${id}`).join(",");
      query = query.or(`club_user_id.eq.${userId},${playerFilter}`);
    } else {
      query = query.eq("club_user_id", userId);
    }

    const { data: convs, error: convError } = await query.order("last_message_at", {
      ascending: false,
    });

    if (convError) {
      console.error("Error fetching conversations:", convError);
      return NextResponse.json({ conversations: [] });
    }

    if (!convs || convs.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // 3. For each conversation, collect partner details, last message, and unread count
    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const isClubSender = conv.club_user_id === userId;

        let partnerName = "Kontakt";
        let partnerRole = "Användare";
        let partnerClub = "";
        let partnerAvatar = "";
        let partnerIsVerified = false;

        if (isClubSender) {
          // Current user is the club, partner is the player
          try {
            const { data: player } = await anonSupabase
              .from("players")
              .select("first_name, last_name, current_club, position, photo_url")
              .eq("id", conv.player_id)
              .maybeSingle();

            if (player) {
              partnerName = `${player.first_name || ""} ${player.last_name || ""}`.trim() || "Spelare";
              partnerRole = "Spelare";
              partnerClub = player.current_club || "";
              partnerAvatar = player.photo_url || "";
              partnerIsVerified = true;
            }
          } catch (err) {
            console.error("Error loading partner player:", err);
          }
        } else {
          // Current user is the player, partner is the club
          try {
            const { data: profile } = await anonSupabase
              .from("user_profiles")
              .select("club_name, display_name, is_verified, verification_method")
              .eq("id", conv.club_user_id)
              .maybeSingle();

            if (profile) {
              partnerName = profile.club_name || profile.display_name || "Klubbrepresentant";
              partnerClub = profile.club_name || "";
              partnerRole = "Klubb";
              partnerIsVerified = Boolean(profile.is_verified);
            } else {
              // Try finding club from club_ads
              const { data: ad } = await anonSupabase
                .from("club_ads")
                .select("club_name, contact_name, contact_email")
                .eq("user_id", conv.club_user_id)
                .limit(1)
                .maybeSingle();

              if (ad) {
                partnerName = ad.club_name || ad.contact_name || "Klubb";
                partnerClub = ad.club_name || "";
                partnerRole = "Klubb";
                partnerIsVerified = isOfficialClubDomain(ad.contact_email);
              }
            }
          } catch (err) {
            console.error("Error loading partner club:", err);
          }
        }

        // Fetch last message
        let lastMessageText = "";
        let lastMessageTime = conv.last_message_at || conv.created_at;
        let lastMessageSenderId = "";
        try {
          const { data: lastMsg } = await anonSupabase
            .from("messages")
            .select("body, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastMsg) {
            lastMessageText = lastMsg.body || "";
            lastMessageTime = lastMsg.created_at;
            lastMessageSenderId = lastMsg.sender_id;
          }
        } catch {}

        // Fetch unread count for current user
        let unreadCount = 0;
        try {
          const { count } = await anonSupabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", userId)
            .eq("read", false);

          unreadCount = count || 0;
        } catch {}

        return {
          id: conv.id,
          createdAt: conv.created_at,
          lastMessageAt: lastMessageTime,
          subject: conv.subject || "Meddelande",
          partner: {
            id: isClubSender ? conv.player_id : conv.club_user_id,
            name: partnerName,
            role: partnerRole,
            club: partnerClub,
            avatar: partnerAvatar,
            isVerified: partnerIsVerified,
          },
          lastMessage: {
            text: lastMessageText,
            time: lastMessageTime,
            isMine: lastMessageSenderId === userId,
          },
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: enriched });
  } catch (error: unknown) {
    console.error("Conversations API GET error:", error);
    const msg = error instanceof Error ? error.message : "Failed to load conversations";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
