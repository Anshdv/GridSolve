export type PlanId = "free" | "monthly" | "yearly";

export type PlanCapabilities = {
  id: PlanId;
  name: string;
  canSeeFullCatalog: boolean;
  canSeeRisk: boolean;
  canCompare: boolean;
  canExport: boolean;
};

export const PLAN_LABEL: Record<PlanId, string> = {
  free: "Sample",
  monthly: "Screening",
  yearly: "Diligence",
};

export const PLAN_CAPABILITIES: Record<PlanId, PlanCapabilities> = {
  free: {
    id: "free",
    name: "Sample",
    canSeeFullCatalog: false,
    canSeeRisk: false,
    canCompare: false,
    canExport: false,
  },
  monthly: {
    id: "monthly",
    name: "Screening",
    canSeeFullCatalog: true,
    canSeeRisk: false,
    canCompare: false,
    canExport: false,
  },
  yearly: {
    id: "yearly",
    name: "Diligence",
    canSeeFullCatalog: true,
    canSeeRisk: true,
    canCompare: true,
    canExport: true,
  },
};

export const PLAN_PRICING = {
  free: { amount: "$0", cadence: "forever", note: "See the instrument" },
  monthly: {
    amount: "$3,000",
    cadence: "/ month",
    note: "Month-to-month while a site is in play",
  },
  yearly: {
    amount: "$30,000",
    cadence: "/ year",
    note: "Two months included vs Screening",
    billedAs: "Annual license",
  },
} as const;

export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    "Six substations, coast to coast",
    "Power score only — no write-down",
    "Enough to judge the model, not a hunt",
  ],
  monthly: [
    "Full national catalog and filters",
    "Power ranking for a live siting sprint",
    "No Risk, compare, print, or CSV — you are ranking, not filing",
  ],
  yearly: [
    "Everything in Screening",
    "Risk, Combined, and four-site compare",
    "Printable site reports and CSV of the current filter",
    "Named contact; extra seats by request",
  ],
};

export const PLAN_COMPARISON: {
  label: string;
  values: Record<PlanId, string>;
}[] = [
  {
    label: "What it’s for",
    values: {
      free: "Taste the instrument",
      monthly: "A live siting sprint",
      yearly: "Write sites down",
    },
  },
  {
    label: "Catalog",
    values: { free: "6 substations", monthly: "Full catalog", yearly: "Full catalog" },
  },
  {
    label: "Power axis",
    values: { free: "Yes", monthly: "Yes", yearly: "Yes" },
  },
  {
    label: "Risk + Combined",
    values: { free: "—", monthly: "—", yearly: "Yes" },
  },
  {
    label: "Compare sites",
    values: { free: "—", monthly: "—", yearly: "Up to 4" },
  },
  {
    label: "Print / CSV",
    values: { free: "—", monthly: "—", yearly: "Reports + filtered CSV" },
  },
  {
    label: "License",
    values: {
      free: "Signed-in sample",
      monthly: "Month-to-month seat",
      yearly: "Annual org · extra seats on request",
    },
  },
];

const YEARLY_EMAILS = new Set(["ansh28.dev@gmail.com"]);
const MONTHLY_EMAILS = new Set(["dev4ansh123@gmail.com"]);

export function planIdForEmail(email: string | null | undefined): PlanId {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (YEARLY_EMAILS.has(normalized)) return "yearly";
  if (MONTHLY_EMAILS.has(normalized)) return "monthly";
  return "free";
}

export function planForEmail(email: string | null | undefined): PlanCapabilities {
  return PLAN_CAPABILITIES[planIdForEmail(email)];
}
