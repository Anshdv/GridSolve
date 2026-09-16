import { createClient } from "@/lib/supabase/server";
import { AUTH_LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { jsonError, sleep } from "@/lib/auth-json";

export async function POST(request: Request) {
  let body: { factorId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const factorId = body.factorId ?? "";
  const code = (body.code ?? "").replace(/\s/g, "");
  if (!factorId || !/^\d{6}$/.test(code)) {
    return jsonError("Enter the 6-digit code from your authenticator app.", 400);
  }

  const ip = clientIp(request);
  const limited = rateLimit(
    `mfa:ip:${ip}`,
    AUTH_LIMITS.mfaIp.limit,
    AUTH_LIMITS.mfaIp.windowMs
  );
  if (!limited.ok) {
    return jsonError(
      "Too many authenticator attempts. Please wait a few minutes.",
      429,
      limited.retryAfterSec
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError("Sign in again to continue.", 401);
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    await sleep(300);
    return jsonError("That authenticator code is invalid. Try again.", 401);
  }

  return Response.json({ ok: true });
}
