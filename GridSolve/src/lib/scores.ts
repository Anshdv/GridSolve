// GridSolve two-axis scoring — POWER (interconnection suitability, higher =
// better) and RISK (natural-hazard safety, higher = SAFER), plus a COMBINED
// score that only rewards sites decent on BOTH axes. Computed entirely
// client-side from the normalized Substation shape in ./data. No fetching, no
// new dependencies, no changes to the source JSON.
//
// ASSUMPTION (source file): the spec references `/data/verity.json`. This repo
// has no such file — the live dataset is `data/gridsolve.json`, already parsed
// and normalized in ./data (the "single source of truth" module). We read that
// rather than re-fetching, which also honors the "do not fetch" constraint.
//
// ASSUMPTION (hazard fields): the RISK axis reads FEMA `hazard_<name>` fields
// (0–100, higher = worse). The current gridsolve.json carries NO hazard_*
// fields, so riskScore/combined are null everywhere until they are added. The
// pipeline is built to activate automatically the moment those fields appear
// on the JSON — data.ts passes any `hazard_*` key through onto `s.hazards`.
//
// The POWER math is the same as the established GridSolve Site Score
// (siteScore.ts); this module restates it as one half of the two-axis view so
// power and risk live behind a single, symmetric API.
import type { Substation } from "./data-meta";

export const COST_CEIL = 1500; // $/kW — effectively prohibitive to connect

// ------------------------------------------------------------------- hazards
// FEMA National Risk Index hazard weights. These are OUR editorial judgment of
// relative concern for siting a data center — NOT derived from the data or fit
// to any outcome. Ordered here highest-weight first for readability. Keys are
// the suffix of the `hazard_<name>` field on the source JSON.
export const HAZARD_WEIGHTS: { key: string; label: string; weight: number }[] = [
  { key: "earthquake", label: "Earthquake", weight: 0.22 },
  { key: "wildfire", label: "Wildfire", weight: 0.2 },
  { key: "hurricane", label: "Hurricane", weight: 0.18 },
  { key: "riverine_flood", label: "Flood", weight: 0.16 },
  { key: "tornado", label: "Tornado", weight: 0.1 },
  { key: "heat_wave", label: "Heat", weight: 0.08 },
  { key: "drought", label: "Drought", weight: 0.06 },
];

// A single hazard reading for a substation: its 0–100 FEMA score (higher =
// worse) paired with our label. Used by the detail panel's per-hazard bars.
export type HazardReading = { key: string; label: string; score: number };

// Extract the hazard readings PRESENT on a substation, in HAZARD_WEIGHTS order.
// A hazard is "present" only when the JSON carries a finite number for it — a
// null/absent field is skipped, never treated as a zero (absence of data is not
// absence of hazard).
export function hazardReadings(s: Substation): HazardReading[] {
  const h = s.hazards ?? {};
  const out: HazardReading[] = [];
  for (const { key, label } of HAZARD_WEIGHTS) {
    const v = h[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      out.push({ key, label, score: v });
    }
  }
  return out;
}

// ------------------------------------------------------------------ results
export type ScoreComponents = {
  scale: number; // 0-1
  phantom: number; // 0-1
  cost: number; // 0-1
  viability: number; // 0-1
};

export type TwoAxisScore = {
  powerScore: number | null; // 0-100, higher = better site
  riskScore: number | null; // 0-100, higher = SAFER (less hazard)
  combined: number | null; // 0-100, only when BOTH axes exist
  exposure: number | null; // 0-100 weighted hazard exposure (higher = worse)
  powerImputed: boolean; // true when cost was filled from the median
  components: ScoreComponents; // power breakdown (for the detail panel)
};

export type ScoreInputs = {
  medianCost: number;
  qMax: number;
};

// A substation paired with its two-axis result. Downstream components carry
// this shape rather than recomputing.
export type ScoredSubstation2 = Substation & { two: TwoAxisScore };

// --------------------------------------------------------------- statistics
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Nearest-rank percentile, p in [0,1].
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)));
  return sorted[idx];
}

// PRECOMPUTE ONCE over the substations: the median network cost (over
// non-null costs) and the 90th-percentile queued MW (over active-queue sites
// only — a station with no queue tells us nothing about typical queue scale).
export function precompute(subs: Substation[]): ScoreInputs {
  const costs = subs
    .map((s) => s.medianNetworkCostPerKw)
    .filter((c): c is number => c != null);
  const queuedActive = subs
    .filter((s) => s.status === "has_active_queue")
    .map((s) => s.queuedMw);
  return {
    medianCost: median(costs),
    qMax: percentile(queuedActive, 0.9),
  };
}

// ----------------------------------------------------------- the two axes
// Compute both axes for one substation. Every null case is handled: no NaN, no
// blanks ever leave this function.
export function scoreSubstation(
  s: Substation,
  { medianCost, qMax }: ScoreInputs
): TwoAxisScore {
  // ---- POWER (higher = better) ----
  const active = s.status === "has_active_queue";
  // No queue tells us nothing about scale → a neutral 0.5 rather than a 0.
  const scale = active
    ? Math.min(Math.log1p(Math.max(s.queuedMw, 0)) / Math.log1p(Math.max(qMax, 1)), 1)
    : 0.5;
  const phantom = s.avgWithdrawRate ?? 0;
  const costImputed = s.medianNetworkCostPerKw == null;
  const c = costImputed ? medianCost : (s.medianNetworkCostPerKw as number);
  const cost = 1 - Math.min(Math.log1p(Math.max(c, 0)) / Math.log1p(COST_CEIL), 1);
  const viability = s.histWithdrawRate == null ? 0.5 : 1 - s.histWithdrawRate;
  const rawPower = 0.3 * scale + 0.2 * phantom + 0.35 * cost + 0.15 * viability;
  const k = Math.min((s.histProjects ?? 0) / 8, 1) * (costImputed ? 0.6 : 1);
  // Power is null only when there is genuinely nothing to score: no active
  // queue AND no cost data. Otherwise cost alone can anchor a score.
  const powerScore =
    !active && costImputed
      ? null
      : Math.round(100 * (0.5 + k * (rawPower - 0.5)));

  // ---- RISK (higher = SAFER) ----
  const readings = hazardReadings(s);
  let exposure: number | null = null;
  let riskScore: number | null = null;
  if (readings.length > 0) {
    // Weighted average over PRESENT hazards, renormalizing the weights across
    // only those present so a site missing a hazard field isn't penalized (or
    // credited) for the absence.
    const weightOf = (key: string) =>
      HAZARD_WEIGHTS.find((w) => w.key === key)?.weight ?? 0;
    let wSum = 0;
    let acc = 0;
    for (const r of readings) {
      const w = weightOf(r.key);
      wSum += w;
      acc += w * r.score;
    }
    exposure = wSum > 0 ? acc / wSum : 0;
    riskScore = Math.round(100 - exposure); // higher exposure → lower (less safe)
  }

  // ---- COMBINED (only when BOTH axes exist) ----
  let combined: number | null = null;
  if (powerScore != null && riskScore != null) {
    const p = powerScore / 100;
    const r = riskScore / 100;
    // Balance penalizes lopsided sites: a great-power / terrible-risk site is
    // dragged down, which is the point — a site must be decent on BOTH axes.
    const balance = Math.min(p, r) / Math.max(p, r, 0.01);
    combined = Math.round(100 * (0.6 * p + 0.4 * r) * (0.7 + 0.3 * balance));
  }

  return {
    powerScore,
    riskScore,
    combined,
    exposure,
    powerImputed: costImputed,
    components: { scale, phantom, cost, viability },
  };
}

// The single axis a view is colored / sorted by.
export type Axis = "power" | "risk" | "combined";

export function axisValue(t: TwoAxisScore, axis: Axis): number | null {
  return axis === "power"
    ? t.powerScore
    : axis === "risk"
    ? t.riskScore
    : t.combined;
}

export const AXIS_LABEL: Record<Axis, string> = {
  power: "Power",
  risk: "Risk",
  combined: "Combined",
};

// --------------------------------------------------------------- coloring
// All three axes are "higher = better" (risk is safety), so one tercile scheme
// works for every axis: top third green, middle amber, bottom red. Terciles are
// computed at runtime from whatever is on screen — never hardcoded, since the
// scores are only meaningful relative to the current view.
export const AXIS_COLOR_TOP = "#22c55e";
export const AXIS_COLOR_MID = "#f59e0b";
export const AXIS_COLOR_LOW = "#ef4444";
export const AXIS_COLOR_NONE = "#6b7280"; // no value on this axis

export function terciles(values: number[]): [number, number] {
  if (values.length === 0) return [0, 0];
  const sorted = [...values].sort((a, b) => a - b);
  const t1 = sorted[Math.floor(sorted.length / 3)];
  const t2 = sorted[Math.floor((2 * sorted.length) / 3)];
  return [t1, t2];
}

export function axisColor(
  value: number | null,
  [t1, t2]: [number, number]
): string {
  if (value == null) return AXIS_COLOR_NONE;
  if (value <= t1) return AXIS_COLOR_LOW;
  if (value <= t2) return AXIS_COLOR_MID;
  return AXIS_COLOR_TOP;
}

export function bandLabel(
  value: number | null,
  [t1, t2]: [number, number]
): string {
  if (value == null) return "no data";
  if (value <= t1) return "Bottom third";
  if (value <= t2) return "Middle third";
  return "Top third";
}

// Human caption naming the 1–2 dominant (worst) hazards on a site, e.g.
// "Primary exposure: wildfire (96), earthquake (99)". Empty string when there
// is no hazard data, so callers can show a "no risk data" line instead.
export function dominantHazardsCaption(s: Substation): string {
  const readings = hazardReadings(s);
  if (readings.length === 0) return "";
  const worst = [...readings].sort((a, b) => b.score - a.score).slice(0, 2);
  const parts = worst.map(
    (r) => `${r.label.toLowerCase()} (${Math.round(r.score)})`
  );
  return `Primary exposure: ${parts.join(", ")}.`;
}

export function makeScoreOf(inputs: ScoreInputs) {
  return (s: Substation) => scoreSubstation(s, inputs);
}
