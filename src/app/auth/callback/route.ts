export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/my-profile";

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("Supabase code exchange error:", error);
    } catch (err) {
      console.error("Auth callback exception:", err);
    }
  }

  // Redirect to target or profile
  return NextResponse.redirect(`${origin}${next}`);
}
