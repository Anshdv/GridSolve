// Handles the redirect from Supabase email links (account confirmation and
// password-reset). Exchanges the one-time `code` for a session cookie, then
// forwards the user to `next` (the explorer by default, or the reset page).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/explorer");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — send them back to login with a hint.
  return NextResponse.redirect(`${origin}/login?error=link`);
}
