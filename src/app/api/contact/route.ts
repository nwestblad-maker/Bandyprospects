export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface ContactRequestBody {
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderRole?: string;
  message: string;
  targetName: string;
  targetEmail?: string;
  targetId?: string;
  type?: "player" | "club";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactRequestBody;
    const {
      senderName,
      senderEmail,
      senderPhone,
      senderRole,
      message,
      targetName,
      targetEmail,
      targetId,
      type = "player",
    } = body;

    // Validate required fields
    if (!senderName?.trim() || !senderEmail?.trim() || !message?.trim() || !targetName?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields (senderName, senderEmail, message, targetName)." },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail.trim())) {
      return NextResponse.json({ error: "Invalid sender email address." }, { status: 400 });
    }

    // Resolve recipient email address
    let recipientEmail = targetEmail?.trim();

    if (!recipientEmail && targetId) {
      try {
        if (type === "player") {
          const { data: playerData } = await supabase
            .from("players")
            .select("email, first_name, last_name")
            .eq("id", targetId)
            .maybeSingle();

          if (playerData?.email) {
            recipientEmail = playerData.email;
          }
        } else {
          const { data: clubData } = await supabase
            .from("club_ads")
            .select("contact_email, club_name")
            .eq("id", targetId)
            .maybeSingle();

          if (clubData?.contact_email) {
            recipientEmail = clubData.contact_email;
          }
        }
      } catch (dbErr) {
        console.error("Error looking up recipient email in Supabase:", dbErr);
      }
    }

    // Fallback recipient if not found
    const finalRecipient = recipientEmail || process.env.ADMIN_CONTACT_EMAIL || "kontakt@bandyprospects.com";

    // Resend Email Integration
    const resendApiKey = process.env.RESEND_API_KEY;
    const senderFromEmail = process.env.RESEND_FROM_EMAIL || "Bandyprospects <kontakt@bandyprospects.com>";

    const roleLabelMap: Record<string, string> = {
      player: "Spelare / Prospect",
      clubDirector: "Klubbrepresentant / Sportchef",
      coach: "Tränare / Scout",
      agent: "Agent / Förmedlare",
    };

    const roleDisplay = senderRole ? roleLabelMap[senderRole] || senderRole : "Intressent";

    const emailSubject = `[Bandyprospects] Ny förfrågan gällande ${targetName} från ${senderName}`;
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
            .details-box { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
            .details-row { margin-bottom: 8px; }
            .details-row:last-child { margin-bottom: 0; }
            .label { font-weight: 600; color: #52525b; }
            .message-box { background: #ffffff; border-left: 3px solid #18181b; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #27272a; white-space: pre-wrap; }
            .footer { font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; text-align: center; }
            .cta-btn { display: inline-block; background-color: #18181b; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <span class="badge">Bandyprospects Kontakt</span>
              <h1 class="title">Ny direktkontakt gällande ${targetName}</h1>
              <p class="subtitle">En intresseanmälan har skickats via kontaktformuläret på Bandyprospects.</p>
            </div>

            <div class="details-box">
              <div class="details-row"><span class="label">Avsändare:</span> ${senderName}</div>
              <div class="details-row"><span class="label">E-post:</span> <a href="mailto:${senderEmail}">${senderEmail}</a></div>
              ${senderPhone ? `<div class="details-row"><span class="label">Telefon:</span> <a href="tel:${senderPhone}">${senderPhone}</a></div>` : ""}
              <div class="details-row"><span class="label">Roll:</span> ${roleDisplay}</div>
              <div class="details-row"><span class="label">Gäller ${type === "club" ? "klubbannons" : "spelare"}:</span> ${targetName}</div>
            </div>

            <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #71717a; margin-bottom: 6px;">Meddelande:</p>
            <div class="message-box">${message}</div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="mailto:${senderEmail}?subject=Re: Förfrågan på Bandyprospects (${targetName})" class="cta-btn">
                Svara direkt till ${senderName}
              </a>
            </div>

            <div class="footer">
              Detta meddelande skickades automatiskt via <a href="https://bandyprospects.com" style="color: #71717a;">Bandyprospects.com</a>.
            </div>
          </div>
        </body>
      </html>
    `;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured.");
      return NextResponse.json(
        { error: "E-posttjänsten är för närvarande inte konfigurerad." },
        { status: 500 }
      );
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderFromEmail,
        to: [finalRecipient],
        reply_to: senderEmail,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.text();
      console.error("Resend API Error:", resendError);
      let errorMsg = "Misslyckades med att skicka e-postmeddelandet.";
      try {
        const parsed = JSON.parse(resendError);
        if (parsed?.message) errorMsg = parsed.message;
      } catch {}
      return NextResponse.json({ error: errorMsg }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been sent successfully.",
      recipient: finalRecipient,
    });
  } catch (error: unknown) {
    console.error("Contact API Route Error:", error);
    const message = error instanceof Error ? error.message : "Failed to process inquiry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
