// Canonical site URL and shared metadata. Set NEXT_PUBLIC_SITE_URL in production
// (e.g. https://grid-solve.com). On Vercel, VERCEL_URL is used as a fallback.
export const siteConfig = {
  name: "GridSolve",
  title: "GridSolve — Interconnection Queue Prediction for Data Center Site Selection",
  description:
    "Predict which grid interconnection queue projects will withdraw and find substations with deliverable capacity. Withdrawal-adjusted interconnection intelligence for data center developers nationwide.",
  tagline: "Where data centers can actually get power",
} as const;

/** Primary and long-tail keywords for metadata and content targeting. */
export const seoKeywords = [
  "interconnection queue",
  "interconnection queue prediction",
  "data center interconnection",
  "data center interconnection queue",
  "grid interconnection",
  "grid interconnection queue",
  "interconnection queue withdrawal",
  "withdrawal-adjusted interconnection capacity",
  "interconnection queue analysis",
  "data center site selection",
  "hosting capacity map",
  "interconnection queue data",
  "substations interconnection capacity",
  "ISO interconnection queue",
  "RTO interconnection queue",
] as const;

export type FaqItem = { question: string; answer: string };

/** Shared FAQ content — reused for on-page copy and FAQPage structured data. */
export const siteFaqs: FaqItem[] = [
  {
    question: "What is the interconnection queue?",
    answer:
      "The interconnection queue is the backlog of generation and storage projects waiting to connect to the electric grid. Each ISO and RTO maintains its own queue. Projects must complete feasibility, system impact, and facility studies before they can operate. Most proposed capacity in U.S. interconnection queues never reaches commercial operation.",
  },
  {
    question: "What is interconnection queue prediction?",
    answer:
      "Interconnection queue prediction estimates which active queue projects are likely to withdraw before reaching commercial operation. GridSolve uses a Cox survival model trained on historical interconnection projects to assign withdrawal probabilities based on cluster studies, technology, service type, and queue position — then discounts substation capacity by expected withdrawals.",
  },
  {
    question: "How does GridSolve help data center developers?",
    answer:
      "Data center developers need to know where grid power is realistically available, not just what hosting-capacity maps claim. GridSolve re-scores 4,600+ U.S. substations by withdrawal-adjusted deliverable megawatts — capacity that remains after likely queue withdrawals — so developers can prioritize sites with real interconnection headroom.",
  },
  {
    question: "Does GridSolve predict data center interconnection requests?",
    answer:
      "GridSolve models generation-interconnection queue projects (solar, wind, storage, and similar), not large-load or data-center interconnection requests, which follow separate utility tariffs. Deliverable capacity per substation is a proxy for where grid headroom is likely to exist — not a load interconnection study.",
  },
  {
    question: "What is withdrawal-adjusted interconnection capacity?",
    answer:
      "Withdrawal-adjusted capacity is the megawatts at a substation that are likely to remain deliverable after speculative queue projects withdraw. GridSolve subtracts each active project's predicted withdrawal share from queued megawatts to produce adjusted available capacity — a more realistic view than raw hosting-capacity figures.",
  },
  {
    question: "What data sources does GridSolve use?",
    answer:
      "GridSolve combines ISO/RTO interconnection queue data from Lawrence Berkeley National Laboratory's Queued Up dataset with LBNL interconnection cost studies. Withdrawal rates are computed empirically within each region from resolved projects; the survival model validates against regional concordance metrics.",
  },
];

export const pageMetadata = {
  home: {
    title: {
      absolute: siteConfig.title,
    },
    description: siteConfig.description,
    alternates: { canonical: "/" },
  },
  interconnectionQueue: {
    title: "Interconnection Queue Prediction & Grid Interconnection Data",
    description:
      "Understand the U.S. interconnection queue, predict project withdrawals, and find substations with deliverable grid capacity. GridSolve applies survival modeling to interconnection queue data for data center and generation developers.",
    alternates: { canonical: "/interconnection-queue" },
  },
  methodology: {
    title: "Interconnection Queue Model & Withdrawal Prediction Methodology",
    description:
      "How GridSolve predicts interconnection queue withdrawals with a Cox survival model, validates by ISO/RTO region, and computes withdrawal-adjusted deliverable capacity at 4,600+ substations nationwide.",
    alternates: { canonical: "/methodology" },
  },
  pricing: {
    title: "Pricing — Sample, Screening, and Diligence License",
    description:
      "GridSolve commercial access: a six-site sample, a $3,000/month screening seat for a live siting sprint, and a $30,000/year diligence license with Risk, Combined, compare, print, and CSV.",
    alternates: { canonical: "/pricing" },
  },
} as const;

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

/** Host shown in authenticator apps (never localhost). */
export function totpIssuerHost(): string {
  try {
    const host = new URL(getSiteUrl()).hostname.replace(/^www\./, "");
    if (host && host !== "localhost" && host !== "127.0.0.1") return host;
  } catch {
    /* fall through */
  }
  return "grid-solve.com";
}

export function brandedTotpUri(originalUri: string, email?: string | null): string {
  const issuer = totpIssuerHost();
  let secret = "";
  let account = email?.trim() || "account";
  const prefix = "otpauth://totp/";
  if (originalUri.startsWith(prefix)) {
    const rest = originalUri.slice(prefix.length);
    const q = rest.indexOf("?");
    const label = decodeURIComponent(q === -1 ? rest : rest.slice(0, q));
    const query = q === -1 ? "" : rest.slice(q + 1);
    secret = new URLSearchParams(query).get("secret") ?? "";
    const colon = label.lastIndexOf(":");
    if (colon >= 0 && label.slice(colon + 1)) account = label.slice(colon + 1);
    else if (label) account = label;
  }
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params.toString()}`;
}

/** Public routes that should appear in the sitemap and be indexed. */
export const publicRoutes = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  {
    path: "/interconnection-queue",
    changeFrequency: "weekly" as const,
    priority: 0.95,
  },
  { path: "/methodology", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/dmca", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/unsubscribe", changeFrequency: "yearly" as const, priority: 0.1 },
];

/** Routes that require auth or handle credentials — keep out of search indexes. */
export const privateRoutePrefixes = [
  "/explorer",
  "/login",
  "/signup",
  "/reset-password",
  "/auth",
  "/accept-terms",
  "/account",
];
