// Levora Site Score — a holistic 0-100 suitability score for data center
// interconnection, computed entirely client-side from data/levora.json (via
// the already-normalized Substation shape in ./data). No fetching, no new
// dependencies, no changes to the source JSON.
//
// The score is RELATIVE within this PacifiCorp dataset, not an absolute
// standard — see scoreTerciles/scoreColor below and the methodology page.
import type { Substation } from "./data";

export const COST_CEIL = 1500; // $/kW — effectively prohibitive to connect

export type ScoreResult = {
  score: number; // 0-100, HIGHER = better for a data center
  raw: number; // pre-confidence weighted sum, 0-1
  confidence: number; // 0-1 — how much evidence backs this score
  components: {
    scale: number; // 0-1
    phantom: number; // 0-1
    cost: number; // 0-1
    viability: number; // 0-1
  };
  imputed: { cost: boolean };
};

export type ScoreInputs = {
  medianCost: number;
  qMax: number;
};

// A substation paired with its computed score (or null, for no-active-queue
// stations that don't get one). Components downstream of the explorer page
// work with this shape rather than the bare Substation.
export type ScoredSubstation = Substation & { scoreResult: ScoreResult | null };

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

// Precompute the two dataset-wide reference values the formula needs, over
// substations with an active queue only (a station with no queue tells us
// nothing about typical cost or queue scale).
export function scoreInputs(subs: Substation[]): ScoreInputs {
  const active = subs.filter((s) => s.hasActiveQueue);
  const costs = active
    .map((s) => s.medianNetworkCostPerKw)
    .filter((c): c is number => c != null);
  const queued = active.map((s) => s.queuedMw);
  return {
    medianCost: median(costs),
    qMax: percentile(queued, 0.9),
  };
}

// Returns null for substations with no active queue — there is nothing to
// score yet (not a zero, an absence). Callers must handle that case
// explicitly rather than coercing it to a number.
export function scoreSubstation(
  s: Substation,
  inputs: ScoreInputs
): ScoreResult | null {
  if (!s.hasActiveQueue) return null;

  // A. SCALE (0.30) — is this a transmission-scale point of interconnection
  // at all? We have no published hosting-capacity figure, so heavy queue
  // activity is our only proxy for "real capacity exists here."
  const scale = Math.min(
    Math.log1p(Math.max(s.queuedMw, 0)) / Math.log1p(Math.max(inputs.qMax, 1)),
    1
  );

  // B. PHANTOM (0.20) — the fraction of the queue expected to withdraw.
  // High is GOOD here: it's capacity that will free up, not power lost.
  const phantom = s.avgWithdrawRate ?? 0;

  // C. COST (0.35) — cheaper network upgrades are better, log-scaled because
  // the difference between $0 and $300/kW matters far more than $2000 vs
  // $2300/kW. Missing cost is imputed from the territory median (computed
  // above) and flagged so confidence can be discounted below.
  const costImputed = s.medianNetworkCostPerKw == null;
  const c = costImputed ? inputs.medianCost : s.medianNetworkCostPerKw!;
  const cost = 1 - Math.min(Math.log1p(Math.max(c, 0)) / Math.log1p(COST_CEIL), 1);

  // D. VIABILITY (0.15) — the inverse of this specific site's own historical
  // withdrawal rate. Unlike "phantom" (its CURRENT queue), this is about
  // whether projects here have actually gotten built in the past. High
  // historical withdrawal is BAD — it means the site itself kills projects,
  // not just that this generation of the queue is inflated.
  const viability = s.histWithdrawRate == null ? 0.5 : 1 - s.histWithdrawRate;

  const raw = 0.3 * scale + 0.2 * phantom + 0.35 * cost + 0.15 * viability;

  // CONFIDENCE — shrink the score toward the neutral midpoint (50) when the
  // evidence behind it is thin: few historical projects to judge the site
  // by, and/or a cost that had to be estimated rather than measured.
  const confidence =
    Math.min((s.histProjects ?? 0) / 8, 1) * (costImputed ? 0.6 : 1);

  const score = Math.round(100 * (0.5 + confidence * (raw - 0.5)));

  return {
    score,
    raw,
    confidence,
    components: { scale, phantom, cost, viability },
    imputed: { cost: costImputed },
  };
}

// Tercile boundaries [t1, t2] over scored (non-null) values: bottom third is
// <= t1, top third is > t2. Computed at runtime from whatever's on screen —
// never hardcoded, since the score is only meaningful relative to this
// specific dataset.
export function scoreTerciles(scores: number[]): [number, number] {
  if (scores.length === 0) return [0, 0];
  const sorted = [...scores].sort((a, b) => a - b);
  const t1 = sorted[Math.floor(sorted.length / 3)];
  const t2 = sorted[Math.floor((2 * sorted.length) / 3)];
  return [t1, t2];
}

export const SCORE_COLOR_TOP = "#22c55e";
export const SCORE_COLOR_MID = "#f59e0b";
export const SCORE_COLOR_LOW = "#ef4444";
export const SCORE_COLOR_NONE = "#6b7280"; // unscored (no active queue)

export function scoreColor(
  score: number | null,
  terciles: [number, number]
): string {
  if (score == null) return SCORE_COLOR_NONE;
  const [t1, t2] = terciles;
  if (score <= t1) return SCORE_COLOR_LOW;
  if (score <= t2) return SCORE_COLOR_MID;
  return SCORE_COLOR_TOP;
}

export function scoreBandLabel(
  score: number | null,
  terciles: [number, number]
): string {
  if (score == null) return "Not scored";
  const [t1, t2] = terciles;
  if (score <= t1) return "Bottom third";
  if (score <= t2) return "Middle third";
  return "Top third";
}

// One-line, human-readable reason confidence is discounted — empty string
// when confidence is already high, so callers can skip the line entirely.
export function confidenceReason(
  s: Substation,
  result: ScoreResult
): string {
  const reasons: string[] = [];
  if ((s.histProjects ?? 0) < 8) reasons.push("based on few projects");
  if (result.imputed.cost) reasons.push("cost estimated from territory median");
  return reasons.join(" · ");
}
