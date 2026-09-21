// Handles redirects from auth emails (sign-in, confirmation, password reset).
// Custom emails send `token_hash` to this app URL so they never inherit
// Supabase's localhost Site URL. PKCE `code` exchanges still work.
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSiteUrl } from "@/lib/site";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function redirectOrigin(requestOrigin: string): string {
  try {
    const host = new URL(requestOrigin).hostname;
    if (
      process.env.NODE_ENV === "production" &&
      (host === "localhost" || host === "127.0.0.1")
    ) {
      return getSiteUrl();
    }
  } catch {
    return getSiteUrl();
  }
  return requestOrigin;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeRedirectPath(searchParams.get("next"), "/explorer");
  const dest = redirectOrigin(origin);
  const tokenHash = searchParams.get("token_hash");
  let typeParam = searchParams.get("type");
  if (typeParam === "email_change_new") typeParam = "email_change";
  const code = searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && typeParam) {
    const type = (
      OTP_TYPES.has(typeParam) ? typeParam : "magiclink"
    ) as EmailOtpType;
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${dest}${next}`);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${dest}${next}`);
    }
  }

  return NextResponse.redirect(`${dest}/login?error=link`);
}
