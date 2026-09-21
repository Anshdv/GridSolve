import { createClient } from "@/lib/supabase/server";
import {
  AUTH_LIMITS,
  clientIp,
  normalizeEmail,
  rateLimit,
} from "@/lib/rate-limit";
import { isValidEmail, jsonError } from "@/lib/auth-json";
import { authCallbackUrl } from "@/lib/site";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const email = normalizeEmail(body.email ?? "");
  if (!isValidEmail(email)) {
    return jsonError("Enter a valid email address.", 400);
  }

  const ip = clientIp(request);
  const limited = rateLimit(
    `forgot:ip:${ip}`,
    AUTH_LIMITS.forgotIp.limit,
    AUTH_LIMITS.forgotIp.windowMs
  );
  if (!limited.ok) {
    return jsonError(
      "Too many reset emails were requested. Please wait a few minutes.",
      429,
      limited.retryAfterSec
    );
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl("/reset-password"),
  });

  return Response.json({
    ok: true,
    notice: `If an account exists for ${email}, a password-reset link is on its way.`,
  });
}
