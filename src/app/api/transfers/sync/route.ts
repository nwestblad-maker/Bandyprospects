import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function handleSync(_request: Request) {
  try {
    // 1. Establish guest session with Profixio for Svenska Bandyförbundet (SBF.SE.BA)
    const loginRes = await fetch("https://www.profixio.com/fx/login.php?login_public=SBF.SE.BA", {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const setCookie = loginRes.headers.get("set-cookie") || "";
    const cookieHeader = setCookie
      .split(/,(?=[^;]+;)/)
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");

    // 2. Fetch official transfers table
    const transfersRes = await fetch("https://www.profixio.com/fx/lisens/public_overgang.php", {
      headers: {
        Cookie: cookieHeader || setCookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.profixio.com/fx/login.php?login_public=SBF.SE.BA",
      },
    });

    if (!transfersRes.ok) {
      return NextResponse.json(
        { error: `Profixio returned HTTP status ${transfersRes.status}` },
        { status: 502 }
      );
    }

    const html = await transfersRes.text();

    // 3. Parse table rows
    const rowRegex = /<tr[^>]*class=['"](?:odd|even)['"][^>]*>([\s\S]*?)<\/tr>/gi;
    const transfers: Array<{
      player_name: string;
      from_club: string;
      to_club: string;
      transfer_date: string;
      sport: string;
      source: string;
    }> = [];

    let match: RegExpExecArray | null;
    while ((match = rowRegex.exec(html)) !== null) {
      const rowContent = match[1];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cols: string[] = [];
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        cols.push(tdMatch[1].replace(/<[^>]*>/g, "").trim());
      }

      if (cols.length >= 6) {
        const lastName = cols[0];
        const firstName = cols[1];
        const fromClub = cols[3].replace(/^FEL\s+/i, "").trim();
        const toClub = cols[4].trim();
        const rawDate = cols[5];

        const transferDate = rawDate ? rawDate.replace(/\./g, "-") : new Date().toISOString().split("T")[0];
        const playerName = `${firstName} ${lastName}`.trim();

        if (playerName && (fromClub || toClub)) {
          transfers.push({
            player_name: playerName,
            from_club: fromClub,
            to_club: toClub,
            transfer_date: transferDate,
            sport: "Bandy",
            source: "Svenska Bandyförbundet / Profixio",
          });
        }
      }
    }

    if (transfers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Inga övergångar kunde parsas från Profixio-svaret.",
        syncedCount: 0,
      });
    }

    // 4. Upsert unique rows into Supabase table 'official_transfers'
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: existingData } = await supabase
      .from("official_transfers")
      .select("player_name, from_club, to_club, transfer_date")
      .limit(2000);

    const existingSet = new Set(
      (existingData || []).map(
        (t) => `${t.player_name}|${t.from_club}|${t.to_club}|${t.transfer_date}`
      )
    );

    const newTransfers = transfers.filter(
      (t) => !existingSet.has(`${t.player_name}|${t.from_club}|${t.to_club}|${t.transfer_date}`)
    );

    let insertedCount = 0;
    if (newTransfers.length > 0) {
      for (let i = 0; i < newTransfers.length; i += 50) {
        const chunk = newTransfers.slice(i, i + 50);
        const { error: insertErr } = await supabase
          .from("official_transfers")
          .insert(chunk);

        if (insertErr) {
          console.error("Error inserting transfers chunk:", insertErr);
        } else {
          insertedCount += chunk.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalParsed: transfers.length,
      newTransfersFound: newTransfers.length,
      syncedCount: insertedCount,
      latestSample: transfers.slice(0, 5),
    });
  } catch (error: unknown) {
    console.error("Transfer sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
