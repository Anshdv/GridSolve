// Lightweight dataset metadata for server-rendered pages. The full ~3MB
// substation array lives in public/data/gridsolve.json and is fetched client-side.
import summary from "../../data/summary.json";

export type RegionValidation = { concordance: number | null; tier: string };

export type Model = {
  coverage: string;
  pacificorp_concordance: number;
  note: string;
  region_validation: Record<string, RegionValidation>;
  withdrawal_rate_note: string;
  coord_source: string;
};

export type Driver = {
  feature: string;
  hazard_ratio: number;
};

export type Status = "has_active_queue" | "no_active_queue";

export type Substation = {
  id: string;
  name: string;
  state: string;
  region: string;
  county: string;
  status: Status;
  hasActiveQueue: boolean;
  queuedMw: number;
  likelyWithdrawMw: number;
  adjustedMw: number;
  avgWithdrawRate: number | null;
  nProjects: number;
  lat: number | null;
  lng: number | null;
  mapped: boolean;
  hasExactCoords: boolean;
  approxLocation: boolean;
  coordPrecision: string | null;
  histProjects: number;
  histWithdrawRate: number | null;
  medianNetworkCostPerKw: number | null;
  nProjectsWithCost: number;
  modelTier: string;
  regionConcordance: number | null;
  hazards: Record<string, number>;
};

export const model: Model = summary.model;
export const drivers: Driver[] = summary.drivers;
export const availableRegions: string[] = summary.availableRegions;
export const availableStates: string[] = summary.availableStates;
export const datasetStats = summary.datasetStats;

export type TierMeta = {
  label: string;
  color: string;
  blurb: string;
};

const TIER_META: Record<string, TierMeta> = {
  validated: {
    label: "Validated",
    color: "#22c55e",
    blurb: "Survival model validated in this region and predictive.",
  },
  usable: {
    label: "Usable",
    color: "#84cc16",
    blurb: "Model validated with usable, if modest, predictive power.",
  },
  marginal: {
    label: "Marginal",
    color: "#f59e0b",
    blurb: "Model only marginally predictive here — read with caution.",
  },
  weak: {
    label: "Weak",
    color: "#f97316",
    blurb: "Model is weak in this region; rankings are rough.",
  },
  not_predictive: {
    label: "Not predictive",
    color: "#ef4444",
    blurb: "Model is no better than chance here (concordance ≈ 0.5).",
  },
  unvalidated: {
    label: "Unvalidated",
    color: "#6b7280",
    blurb: "Model was not validated for this region — treat as unproven.",
  },
};

export function tierMeta(tier: string): TierMeta {
  return (
    TIER_META[tier] ?? {
      label: tier,
      color: "#6b7280",
      blurb: "Model validation status for this region.",
    }
  );
}

export const COST_LOW_MAX = 150;
export const COST_MID_MAX = 600;

export function costBand(
  costPerKw: number | null
): { label: string; color: string } {
  if (costPerKw == null) return { label: "No cost data", color: "#6b7280" };
  if (costPerKw < COST_LOW_MAX) return { label: "Low", color: "#22c55e" };
  if (costPerKw <= COST_MID_MAX) return { label: "Moderate", color: "#f59e0b" };
  return { label: "High", color: "#ef4444" };
}

export function colorForCost(costPerKw: number | null): string {
  return costBand(costPerKw).color;
}

export type CostBandKey = "any" | "low" | "mid" | "high";

export function matchesCostBand(s: Substation, band: CostBandKey): boolean {
  if (band === "any") return true;
  const c = s.medianNetworkCostPerKw;
  if (c == null) return false;
  if (band === "low") return c < COST_LOW_MAX;
  if (band === "mid") return c >= COST_LOW_MAX && c <= COST_MID_MAX;
  return c > COST_MID_MAX;
}
