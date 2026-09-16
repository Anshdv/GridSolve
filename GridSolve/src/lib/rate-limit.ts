// In-memory sliding window. On Cloudflare each isolate has its own map, so
// this is defense in depth (stops noisy single-isolate brute force) rather
// than a global quota. Pair with Supabase's own auth rate limits.

type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): LimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((recent[0] + windowMs - now) / 1000)
    );
    return { ok: false, retryAfterSec };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const AUTH_LIMITS = {
  loginIp: { limit: 8, windowMs: 15 * 60 * 1000 },
  loginEmail: { limit: 10, windowMs: 60 * 60 * 1000 },
  otpIp: { limit: 5, windowMs: 15 * 60 * 1000 },
  otpEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
  forgotIp: { limit: 5, windowMs: 15 * 60 * 1000 },
  mfaIp: { limit: 8, windowMs: 15 * 60 * 1000 },
} as const;
