// Session lives in cookies (via @supabase/ssr), not localStorage — XSS cannot
// trivially exfiltrate a token from localStorage if it was never put there.
import type { CookieOptionsWithName } from "@supabase/ssr";

export const authCookieOptions: CookieOptionsWithName = {
  path: "/",
  sameSite: "lax",
  // Secure cookies in production so the session never rides over HTTP.
  secure: process.env.NODE_ENV === "production",
};
