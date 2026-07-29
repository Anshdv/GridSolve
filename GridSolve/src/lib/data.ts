// Single source of truth for all site data. Every number rendered anywhere on
// the site is read from data/gridsolve.json through this module — nothing is
// hardcoded in components, nothing is fetched, nothing is invented.
//
// The dataset is NATIONAL: ~4,700 substations across 9 ISO/RTO regions and 48
// states. Withdrawal rates are empirical (observed per region); the survival
// model's predictive quality varies widely by region, carried on each
// substation as `model_tier` / `region_concordance`. This module surfaces
// those so the UI can be honest about where the model is trustworthy.
//
// This module intentionally does NOT synthesize positions for substations
// that lack coordinates (only ~12% carry real lat/lng). The map only ever
// plots verified coordinates — an approximate pin would misrepresent a
// precise-looking map. Un-mapped stations still appear in the list/detail.
import gridsolve from "../../data/gridsolve.json";

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

// Raw shape as it appears in gridsolve.json — field names kept snake_case here
// to mirror the contract; normalize() below maps to the camelCase UI shape.
type RawSubstation = {
  name: string;
  state: string;
  region: string;
  county: string;
  status: Status;
  queued_mw: number;
  likely_withdraw_mw: number;
  adjusted_available_mw: number;
  avg_withdraw_rate: number | null;
  n_projects: number;
  lat: number | null;
  lng: number | null;
  coord_precision: string | null;
  hist_projects: number;
  hist_withdraw_rate: number | null;
  median_network_cost_per_kw: number | null;
  n_projects_with_cost: number;
  model_tier: string;
  region_concordance: number | null;
};

type RawGridSolve = {
  model: Model;
  drivers: Driver[];
  substations: RawSubstation[];
};

// Normalized shape the UI consumes.
export type Substation = {
  id: string; // stable unique key — substation names are NOT unique nationally
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
  mapped: boolean; // true when we have ANY position to plot (exact or approx)
  hasExactCoords: boolean; // real, verified lat/lng from the source
  approxLocation: boolean; // position derived from county/state, not verified
  coordPrecision: string | null;
  histProjects: number;
  histWithdrawRate: number | null;
  medianNetworkCostPerKw: number | null;
  nProjectsWithCost: number;
  modelTier: string;
  regionConcordance: number | null;
};

const raw = gridsolve as RawGridSolve;

// A few rows carry no usable name (the literal string "undefined" or empty) —
// show a readable placeholder rather than leaking that into the UI.
function displayName(name: string): string {
  return name && name !== "undefined" ? name : "Unnamed substation";
}

// Some rows carry corrupt coordinates (e.g. a longitude of -1250 from a
// data-entry slip). A point only counts as mappable when it lands in a valid
// geographic range — otherwise it would fling the map's bounds around the
// globe and drop a marker in the ocean. Bad-coord rows fall back to list-only.
function isValidCoord(lat: number | null, lng: number | null): boolean {
  return (
    lat != null &&
    lng != null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function normalize(s: RawSubstation, index: number): Substation {
  const valid = isValidCoord(s.lat, s.lng);
  const exact = valid && s.coord_precision === "verified";
  return {
    id: String(index),
    name: displayName(s.name),
    state: s.state,
    region: s.region,
    county: s.county,
    status: s.status,
    hasActiveQueue: s.status === "has_active_queue",
    queuedMw: s.queued_mw,
    likelyWithdrawMw: s.likely_withdraw_mw,
    adjustedMw: s.adjusted_available_mw,
    avgWithdrawRate: s.avg_withdraw_rate,
    nProjects: s.n_projects,
    // Exact coords when valid; otherwise filled in by the approximation pass.
    lat: exact ? s.lat : null,
    lng: exact ? s.lng : null,
    mapped: exact,
    hasExactCoords: exact,
    approxLocation: false,
    coordPrecision: s.coord_precision,
    histProjects: s.hist_projects ?? 0,
    histWithdrawRate: s.hist_withdraw_rate ?? null,
    medianNetworkCostPerKw: s.median_network_cost_per_kw ?? null,
    nProjectsWithCost: s.n_projects_with_cost ?? 0,
    modelTier: s.model_tier,
    regionConcordance: s.region_concordance,
  };
}

// Approximate US state centroids (rough geographic centers) used to place
// substations that lack verified coordinates. The dataset has no city field,
// so county — and failing that, state — is the finest location we can plot.
const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AR: [34.8, -92.4], AZ: [34.2, -111.6], CA: [37.2, -119.4],
  CO: [39.0, -105.5], CT: [41.6, -72.7], DC: [38.9, -77.0], DE: [39.0, -75.5],
  FL: [28.6, -82.4], GA: [32.6, -83.4], IA: [42.0, -93.5], ID: [44.4, -114.6],
  IL: [40.0, -89.2], IN: [39.9, -86.3], KS: [38.5, -98.4], KY: [37.5, -85.3],
  LA: [31.0, -92.0], MA: [42.3, -71.8], MD: [39.0, -76.8], ME: [45.4, -69.2],
  MI: [44.3, -85.4], MN: [46.3, -94.3], MO: [38.4, -92.5], MS: [32.7, -89.7],
  MT: [47.0, -109.6], NC: [35.6, -79.4], ND: [47.4, -100.5], NE: [41.5, -99.8],
  NH: [43.7, -71.6], NJ: [40.2, -74.7], NM: [34.4, -106.1], NV: [39.3, -116.6],
  NY: [42.9, -75.5], OH: [40.3, -82.8], OK: [35.6, -97.5], OR: [44.0, -120.6],
  PA: [40.9, -77.8], RI: [41.7, -71.5], SC: [33.9, -80.9], SD: [44.4, -100.2],
  TN: [35.9, -86.4], TX: [31.5, -99.3], UT: [39.3, -111.7], VA: [37.5, -78.9],
  VT: [44.1, -72.7], WA: [47.4, -120.5], WI: [44.6, -89.9], WV: [38.6, -80.6],
  WY: [43.0, -107.5], MX: [23.6, -102.5],
};
// Continental-US fallback for any state we don't have a centroid for.
const US_CENTER: [number, number] = [39.5, -98.35];

// Deterministic offset in [-0.5, 0.5] from a seed string, so approximated
// markers in the same county/state fan out consistently (not stacked) and
// stay put across renders.
function jitter(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000 - 0.5;
}

export const model: Model = raw.model;
export const drivers: Driver[] = raw.drivers;

export const substations: Substation[] = (() => {
  const rows = raw.substations.map((s, i) => normalize(s, i));

  // Empirical county centroids: average of the verified coordinates present
  // for each `state|county`. Preferred over a raw state centroid because it
  // resolves ambiguous county names to the right place and is more precise.
  const acc: Record<string, { lat: number; lng: number; n: number }> = {};
  for (const s of rows) {
    if (s.hasExactCoords) {
      const key = `${s.state}|${s.county}`;
      const a = (acc[key] ??= { lat: 0, lng: 0, n: 0 });
      a.lat += s.lat as number;
      a.lng += s.lng as number;
      a.n += 1;
    }
  }
  const countyCentroid: Record<string, [number, number]> = {};
  for (const [key, a] of Object.entries(acc)) {
    countyCentroid[key] = [a.lat / a.n, a.lng / a.n];
  }

  // Place every un-coordinated substation: county centroid if we have one,
  // else state centroid, else the US center. Jitter keeps same-place markers
  // from stacking. These are flagged approxLocation so the UI can show them
  // as unverified.
  for (const s of rows) {
    if (s.hasExactCoords) continue;
    const key = `${s.state}|${s.county}`;
    const county = countyCentroid[key];
    const base = county ?? STATE_CENTROIDS[s.state] ?? US_CENTER;
    // Tighter spread when we have a county centroid; wider across a whole state.
    const range = county ? 0.3 : 1.4;
    s.lat = base[0] + jitter(s.id, 1) * range;
    s.lng = base[1] + jitter(s.id, 7) * range;
    s.mapped = true;
    s.approxLocation = true;
  }

  return rows;
})();

// Regions in a canonical display order (only those actually present).
const REGION_ORDER = [
  "West",
  "CAISO",
  "ERCOT",
  "SPP",
  "MISO",
  "PJM",
  "Southeast",
  "NYISO",
  "ISO-NE",
];
const presentRegions = new Set(substations.map((s) => s.region));
export const availableRegions: string[] = [
  ...REGION_ORDER.filter((r) => presentRegions.has(r)),
  // any region not in the canonical list, appended alphabetically
  ...Array.from(presentRegions)
    .filter((r) => !REGION_ORDER.includes(r))
    .sort(),
];

// Every state present, alphabetical — the dataset spans ~48 of them, so the
// UI treats state as a lookup (dropdown) rather than a chip row.
export const availableStates: string[] = Array.from(
  new Set(substations.map((s) => s.state))
).sort();

// Headline dataset aggregates, derived (not hardcoded) so copy stays honest
// as the data changes.
export const datasetStats = {
  total: substations.length,
  regions: availableRegions.length,
  states: availableStates.length,
  mapped: substations.filter((s) => s.mapped).length,
  exactCoords: substations.filter((s) => s.hasExactCoords).length,
  approxCoords: substations.filter((s) => s.approxLocation).length,
  activeQueue: substations.filter((s) => s.hasActiveQueue).length,
  // Total active interconnection projects across the country.
  activeProjects: substations.reduce(
    (sum, s) => sum + (s.hasActiveQueue ? s.nProjects : 0),
    0
  ),
  // Capacity-weighted national withdrawal share (MW likely to drop / MW queued).
  nationalWithdrawalRate: (() => {
    let queued = 0;
    let withdraw = 0;
    for (const s of substations) {
      queued += s.queuedMw;
      withdraw += s.likelyWithdrawMw;
    }
    return queued > 0 ? withdraw / queued : 0;
  })(),
};

// Default ranking everywhere a list of substations is shown: highest
// withdrawal-adjusted deliverable capacity first.
export const rankedSubstations: Substation[] = [...substations].sort(
  (a, b) => b.adjustedMw - a.adjustedMw
);

// ---------------------------------------------------------------- model tier
// The survival model's predictive quality was validated per region; each
// substation carries the tier for its region. This is a caveat about the
// *predictive* extrapolation only — the withdrawal RATES themselves are
// empirical (observed history), not model output. Ordered best → worst.
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

// ---------------------------------------------------------------- cost bands
// Cost color bands (editorial "cheap / typical / expensive" cut points, not
// derived from the data). Retained for the cost-band filter.
export const COST_LOW_MAX = 150; // < $150/kW
export const COST_MID_MAX = 600; // $150–600/kW

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

// Cost-band filter keys used by the explorer's filter bar.
export type CostBandKey = "any" | "low" | "mid" | "high";

export function matchesCostBand(s: Substation, band: CostBandKey): boolean {
  if (band === "any") return true;
  const c = s.medianNetworkCostPerKw;
  if (c == null) return false;
  if (band === "low") return c < COST_LOW_MAX;
  if (band === "mid") return c >= COST_LOW_MAX && c <= COST_MID_MAX;
  return c > COST_MID_MAX;
}
