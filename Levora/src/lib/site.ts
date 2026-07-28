// Canonical site URL and shared metadata. Set NEXT_PUBLIC_SITE_URL in production
// (e.g. https://levora.example.com). On Vercel, VERCEL_URL is used as a fallback.
export const siteConfig = {
  name: "Levora",
  title: "Levora — Where data centers can actually get power",
  description:
    "Withdrawal-adjusted interconnection capacity nationwide, for data center site selection.",
  tagline: "Where data centers can actually get power",
} as const;

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

/** Public routes that should appear in the sitemap and be indexed. */
export const publicRoutes = [
  { path: "/", changeFrequency: "monthly" as const, priority: 1 },
  { path: "/methodology", changeFrequency: "monthly" as const, priority: 0.8 },
];

/** Routes that require auth or handle credentials — keep out of search indexes. */
export const privateRoutePrefixes = [
  "/explorer",
  "/login",
  "/reset-password",
  "/auth",
];
