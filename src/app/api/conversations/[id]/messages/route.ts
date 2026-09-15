export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { supabase as anonSupabase } from "@/lib/supabaseClient";

interface MessageRequestBody {
  body: string;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();

    let currentUser = authData?.user;
    if (!currentUser) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await anonSupabase.auth.getUser(token);
        if (tokenUser?.user) currentUser = tokenUser.user;
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch messages
    const { data: messages, error } = await anonSupabase
      .from("messages")
      .select("id, created_at, conversation_id, sender_id, sender_name, sender_role, body, read")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Mark unread messages sent by the partner as read
    try {
      await anonSupabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUser.id)
        .eq("read", false);
    } catch (e) {
      console.error("Failed to mark messages as read:", e);
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: unknown) {
    console.error("Messages GET error:", error);
    const msg = error instanceof Error ? error.message : "Failed to load messages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    const bodyJson = (await request.json()) as MessageRequestBody;
    const messageBody = (bodyJson.body || "").trim();

    if (!messageBody) {
      return NextResponse.json({ error: "Message body cannot be empty." }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();

    let currentUser = authData?.user;
    if (!currentUser) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await anonSupabase.auth.getUser(token);
        if (tokenUser?.user) currentUser = tokenUser.user;
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = currentUser.id;
    const userEmail = currentUser.email?.toLowerCase().trim() || "";

    // 1. Fetch conversation details to determine partner and roles
    const { data: conv, error: convErr } = await anonSupabase
      .from("conversations")
      .select("id, player_id, club_user_id, subject")
      .eq("id", conversationId)
      .maybeSingle();

    if (convErr || !conv) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    // 2. Determine sender details
    let senderName = userEmail;
    let senderRole: "player" | "club" = "player";
    let recipientEmail = "";
    let recipientName = "Mottagare";

    if (conv.club_user_id === userId) {
      // Sender is the club
      senderRole = "club";
      const { data: profile } = await anonSupabase
        .from("user_profiles")
        .select("club_name, display_name")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        senderName = profile.display_name || profile.club_name || userEmail;
      }

      // Recipient is the player
      const { data: player } = await anonSupabase
        .from("players")
        .select("email, first_name, last_name")
        .eq("id", conv.player_id)
        .maybeSingle();

      if (player) {
        recipientEmail = player.email;
        recipientName = `${player.first_name} ${player.last_name}`.trim();
      }
    } else {
      // Sender is the player
      senderRole = "player";
      const { data: player } = await anonSupabase
        .from("players")
        .select("email, first_name, last_name")
        .eq("id", conv.player_id)
        .maybeSingle();

      if (player) {
        senderName = `${player.first_name} ${player.last_name}`.trim() || userEmail;
      }

      // Recipient is the club
      const { data: clubProfile } = await anonSupabase
        .from("user_profiles")
        .select("club_name, display_name")
        .eq("id", conv.club_user_id)
        .maybeSingle();

      if (clubProfile) {
        recipientName = clubProfile.club_name || clubProfile.display_name || "Klubb";
      }

      // Look up club email
      const { data: clubAd } = await anonSupabase
        .from("club_ads")
        .select("contact_email, club_name")
        .eq("user_id", conv.club_user_id)
        .limit(1)
        .maybeSingle();

      if (clubAd?.contact_email) {
        recipientEmail = clubAd.contact_email;
      }
    }

    // 3. Insert message into messages table
    const { data: insertedMsg, error: insertError } = await anonSupabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_name: senderName,
        sender_role: senderRole,
        body: messageBody,
        read: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting message:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 4. Update conversations.last_message_at
    await anonSupabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    // 5. Send ONE transactional notification email via Resend to the recipient
    if (recipientEmail && process.env.RESEND_API_KEY) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bandyprospects.com";
        const conversationLink = `${siteUrl}/messages?id=${conversationId}`;

        const emailSubject = `Nytt meddelande från ${senderName} på Bandy Prospects`;
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
                .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .header { border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 24px; }
                .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; background-color: #18181b; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                .title { font-size: 20px; font-weight: 800; color: #09090b; margin: 12px 0 4px 0; }
                .subtitle { font-size: 13px; color: #71717a; margin: 0; }
                .message-box { background: #f8fafc; border-left: 3px solid #18181b; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #27272a; white-space: pre-wrap; border-radius: 4px; }
                .cta-btn { display: inline-block; background-color: #18181b; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; margin-top: 12px; }
                .footer { font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <span class="badge">Bandyprospects Meddelanden</span>
                  <h1 class="title">Nytt meddelande från ${senderName}</h1>
                  <p class="subtitle">Du har fått ett nytt meddelande på Bandy Prospects.</p>
                </div>

                <p style="font-size: 13px; color: #52525b; margin: 0 0 8px 0;">
                  Hej ${recipientName}, du har fått ett meddelande:
                </p>

                <div class="message-box">${messageBody}</div>

                <div style="text-align: center; margin: 28px 0 16px 0;">
                  <a href="${conversationLink}" class="cta-btn">
                    Läs och svara här →
                  </a>
                </div>

                <div class="footer">
                  Detta meddelande skickades via internmeddelanden på <a href="https://bandyprospects.com" style="color: #71717a;">Bandyprospects.com</a>.
                </div>
              </div>
            </body>
          </html>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "Bandyprospects <kontakt@bandyprospects.com>",
            to: [recipientEmail],
            reply_to: userEmail || undefined,
            subject: emailSubject,
            html: emailHtml,
          }),
        });
      } catch (emailErr) {
        console.error("Resend notification email error in message reply:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: insertedMsg,
    });
  } catch (error: unknown) {
    console.error("Messages POST error:", error);
    const msg = error instanceof Error ? error.message : "Failed to post message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
