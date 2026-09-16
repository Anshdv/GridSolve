// Session refresh + route protection, run from src/middleware.ts on every request.
// Keeps the Supabase auth cookie fresh (required for Server Components to see
// the session) and gates protected routes.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasAcceptedTerms, hasEnrolledMfa } from "@/lib/validation";
import { authCookieOptions } from "@/lib/supabase/cookies";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Prefixes that require an authenticated user. Logged-out visitors are sent to
// /login with a `redirect` back to where they were headed.
const PROTECTED_PREFIXES = ["/explorer", "/account", "/data"];

// Authenticated users must accept Terms/Privacy before using protected features.
const TERMS_EXEMPT_PATHS = [
  "/accept-terms",
  "/terms",
  "/privacy",
  "/login",
  "/signup",
  "/reset-password",
  "/auth",
];

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
      loginUrl.searchParams.set("redirect", safeRedirectPath(path));
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookieOptions: authCookieOptions,
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

  let needsMfa = false;
  if (user) {
    try {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      needsMfa =
        aal.data?.nextLevel === "aal2" && aal.data.currentLevel !== "aal2";
    } catch {
      needsMfa = false;
    }
  }

  const needsMfaEnrollment = Boolean(user) && !hasEnrolledMfa(user?.user_metadata);

  if (needsMfaEnrollment && path !== "/signup" && !path.startsWith("/auth")) {
    if (isProtected || path === "/login") {
      const enrollUrl = request.nextUrl.clone();
      enrollUrl.pathname = "/signup";
      enrollUrl.search = "";
      const dest = safeRedirectPath(path);
      if (dest !== "/explorer" && isProtected) {
        enrollUrl.searchParams.set("redirect", dest);
      }
      return NextResponse.redirect(enrollUrl);
    }
  }

  if ((!user || needsMfa) && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", safeRedirectPath(path));
    return NextResponse.redirect(loginUrl);
  }

  const needsTermsAcceptance =
    user &&
    isProtected &&
    !hasAcceptedTerms(user.user_metadata) &&
    !TERMS_EXEMPT_PATHS.some((p) => path.startsWith(p));

  if (needsTermsAcceptance) {
    const termsUrl = request.nextUrl.clone();
    termsUrl.pathname = "/accept-terms";
    termsUrl.searchParams.set("redirect", safeRedirectPath(path));
    return NextResponse.redirect(termsUrl);
  }

  // Already signed in and hitting auth pages → send them into the app.
  if (
    user &&
    !needsMfa &&
    !needsMfaEnrollment &&
    (path === "/login" || path === "/signup")
  ) {
    const dest = request.nextUrl.clone();
    dest.pathname = hasAcceptedTerms(user.user_metadata)
      ? "/explorer"
      : "/accept-terms";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  return supabaseResponse;
}
