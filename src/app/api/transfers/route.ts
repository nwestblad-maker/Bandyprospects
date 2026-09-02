import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Fallback mock transfers if database is empty or pending initial sync
const FALLBACK_TRANSFERS = [
  {
    id: "fb-1",
    player_name: "Christoffer Edlund",
    from_club: "Villa Lidköping BK",
    to_club: "Vetlanda BK",
    transfer_date: "2026-09-02",
    sport: "Bandy",
    source: "Svenska Bandyförbundet / Profixio",
  },
  {
    id: "fb-2",
    player_name: "Samuel Baatz",
    from_club: "IF Boltic",
    to_club: "IFK Vänersborg",
    transfer_date: "2026-09-01",
    sport: "Bandy",
    source: "Svenska Bandyförbundet / Profixio",
  },
  {
    id: "fb-3",
    player_name: "Emil Viklund",
    from_club: "Sandvikens AIK",
    to_club: "Bollnäs GIF",
    transfer_date: "2026-08-29",
    sport: "Bandy",
    source: "Svenska Bandyförbundet / Profixio",
  },
  {
    id: "fb-4",
    player_name: "Teemu Määttä",
    from_club: "AIK Bandy",
    to_club: "Sirius Bandy",
    transfer_date: "2026-08-27",
    sport: "Bandy",
    source: "Svenska Bandyförbundet / Profixio",
  },
  {
    id: "fb-5",
    player_name: "Oscar Westh",
    from_club: "Bollnäs GIF",
    to_club: "Broberg/Söderhamn Bandy",
    transfer_date: "2026-08-25",
    sport: "Bandy",
    source: "Svenska Bandyförbundet / Profixio",
  },
  {
    id: "fb-6",
    player_name: "Martin Karlsson",
    from_club: "Villa Lidköping BK",
    to_club: "Gripen Trollhättan BK",
    transfer_date: "2026-08-22",
    sport: "Bandy",
    source: "Svenska Bandyförbundet / Profixio",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "15", 10);
    const limit = isNaN(limitParam) ? 15 : Math.min(limitParam, 50);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from("official_transfers")
      .select("*")
      .order("transfer_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Error fetching official_transfers from Supabase, serving fallback:", error);
      return NextResponse.json({
        transfers: FALLBACK_TRANSFERS.slice(0, limit),
        isFallback: true,
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        transfers: FALLBACK_TRANSFERS.slice(0, limit),
        isFallback: true,
      });
    }

    return NextResponse.json({
      transfers: data,
      isFallback: false,
    });
  } catch (err: unknown) {
    console.error("Transfers API route error:", err);
    return NextResponse.json({
      transfers: FALLBACK_TRANSFERS,
      isFallback: true,
    });
  }
}
