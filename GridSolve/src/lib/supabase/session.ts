// Session refresh + route protection, run from src/middleware.ts on every request.
// Keeps the Supabase auth cookie fresh (required for Server Components to see
// the session) and gates protected routes.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Prefixes that require an authenticated user. Logged-out visitors are sent to
// /login with a `redirect` back to where they were headed.
const PROTECTED_PREFIXES = ["/explorer"];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  // Supabase env vars missing — still gate protected routes so the explorer
  // stays closed; the login page explains what to configure.
  if (!url || !key) {
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: getUser() must be called to refresh the token; don't run other
  // logic between createServerClient and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in and hitting the login page → send them into the app.
  if (user && path === "/login") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/explorer";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  return supabaseResponse;
}
