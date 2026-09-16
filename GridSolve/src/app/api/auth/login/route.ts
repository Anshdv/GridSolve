import { createClient } from "@/lib/supabase/server";
import {
  AUTH_LIMITS,
  clientIp,
  normalizeEmail,
  rateLimit,
} from "@/lib/rate-limit";
import { isValidEmail, jsonError, sleep } from "@/lib/auth-json";
import { hasEnrolledMfa } from "@/lib/validation";

const GENERIC_LOGIN_ERROR = "Email or password is incorrect.";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  if (!isValidEmail(email) || !password) {
    return jsonError(GENERIC_LOGIN_ERROR, 401);
  }

  const ip = clientIp(request);
  const ipLimit = rateLimit(
    `login:ip:${ip}`,
    AUTH_LIMITS.loginIp.limit,
    AUTH_LIMITS.loginIp.windowMs
  );
  const emailLimit = rateLimit(
    `login:email:${email}`,
    AUTH_LIMITS.loginEmail.limit,
    AUTH_LIMITS.loginEmail.windowMs
  );
  if (!ipLimit.ok || !emailLimit.ok) {
    const retry = Math.max(
      ipLimit.ok ? 0 : ipLimit.retryAfterSec,
      emailLimit.ok ? 0 : emailLimit.retryAfterSec
    );
    return jsonError(
      "Too many sign-in attempts. Please wait a few minutes and try again.",
      429,
      retry
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await sleep(400);
    return jsonError(GENERIC_LOGIN_ERROR, 401);
  }

  try {
    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.data?.nextLevel === "aal2" && aal.data.currentLevel !== "aal2") {
      const factors = await supabase.auth.mfa.listFactors();
      const totp = factors.data?.totp.find((f) => f.status === "verified");
      return Response.json({
        mfaRequired: true,
        factorId: totp?.id ?? null,
      });
    }
  } catch {
    // MFA not enabled on the project — still require enrollment when the flag is missing.
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && !hasEnrolledMfa(user.user_metadata)) {
    return Response.json({ enrollRequired: true });
  }

  return Response.json({ ok: true });
}
