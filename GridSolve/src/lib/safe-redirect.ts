// Only allow in-app relative paths. Blocks open redirects like
// /login?redirect=https://evil.example or //evil.example.
const FALLBACK = "/explorer";

export function safeRedirectPath(
  value: string | null | undefined,
  fallback = FALLBACK
): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\")) return fallback;
  if (/[\s<>'"]/.test(trimmed)) return fallback;
  return trimmed;
}
