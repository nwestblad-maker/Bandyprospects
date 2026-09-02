import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const rawNext = requestUrl.searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
    ? rawNext
    : (rawNext ? `/${rawNext}` : "/my-profile");

  // Ta hänsyn till eventuell reverse proxy / load balancer i produktion
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const origin = !isLocalEnv && forwardedHost
    ? `https://${forwardedHost}`
    : requestUrl.origin;

  if (code || (token_hash && type)) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Route Handler / Server Component.
            }
          },
        },
      }
    );

    let error = null;

    if (token_hash && type) {
      const result = await supabase.auth.verifyOtp({ type, token_hash });
      error = result.error;
    } else if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      error = result.error;
    }

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  // Omdirigera till profilsidan eller angiven 'next'-sida efter lyckad inloggning
  return NextResponse.redirect(`${origin}${next}`);
}
