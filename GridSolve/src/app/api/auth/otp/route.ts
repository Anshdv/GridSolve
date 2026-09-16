import { createClient } from "@/lib/supabase/server";
import {
  AUTH_LIMITS,
  clientIp,
  normalizeEmail,
  rateLimit,
} from "@/lib/rate-limit";
import { isValidEmail, jsonError, sleep } from "@/lib/auth-json";

export async function POST(request: Request) {
  let body: { email?: string; token?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const email = normalizeEmail(body.email ?? "");
  const action = body.action === "verify" ? "verify" : "send";
  if (!isValidEmail(email)) {
    return jsonError("Enter a valid email address.", 400);
  }

  const ip = clientIp(request);
  const ipLimit = rateLimit(
    `otp:ip:${ip}`,
    AUTH_LIMITS.otpIp.limit,
    AUTH_LIMITS.otpIp.windowMs
  );
  const emailLimit = rateLimit(
    `otp:email:${email}`,
    AUTH_LIMITS.otpEmail.limit,
    AUTH_LIMITS.otpEmail.windowMs
  );
  if (!ipLimit.ok || !emailLimit.ok) {
    const retry = Math.max(
      ipLimit.ok ? 0 : ipLimit.retryAfterSec,
      emailLimit.ok ? 0 : emailLimit.retryAfterSec
    );
    return jsonError(
      "Too many one-time code attempts. Please wait a few minutes.",
      429,
      retry
    );
  }

  const supabase = await createClient();

  if (action === "send") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      await sleep(300);
    }
    // Same response whether or not the account exists.
    return Response.json({
      ok: true,
      notice: `If an account exists for ${email}, a one-time code is on its way.`,
    });
  }

  const token = (body.token ?? "").replace(/\s/g, "");
  if (!/^\d{6,8}$/.test(token)) {
    return jsonError("Enter the 6-digit code from your email.", 400);
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    await sleep(300);
    return jsonError("That code is invalid or expired. Try again.", 401);
  }

  return Response.json({ ok: true });
}
