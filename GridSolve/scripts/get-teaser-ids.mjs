import gridsolve from "../data/gridsolve.json" with { type: "json" };
import { scoreInputs, scoreSubstation, scoreTerciles } from "../src/lib/siteScore.ts";

function isValidCoord(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

const SCORE_INPUTS = scoreInputs(
  gridsolve.substations.map((s, i) => ({
    id: String(i),
    name: s.name && s.name !== "undefined" ? s.name : "Unnamed substation",
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
    lat: isValidCoord(s.lat, s.lng) ? s.lat : null,
    lng: isValidCoord(s.lat, s.lng) ? s.lng : null,
    mapped: isValidCoord(s.lat, s.lng),
    hasExactCoords: isValidCoord(s.lat, s.lng),
    approxLocation: false,
    coordPrecision: s.coord_precision,
    histProjects: s.hist_projects ?? 0,
    histWithdrawRate: s.hist_withdraw_rate,
    medianNetworkCostPerKw: s.median_network_cost_per_kw,
    nProjectsWithCost: s.n_projects_with_cost ?? 0,
    modelTier: s.model_tier,
    regionConcordance: s.region_concordance,
  }))
);

const SCORED = gridsolve.substations.map((s, i) => ({
  index: i,
  name: s.name,
  state: s.state,
  county: s.county,
  region: s.region,
  lat: s.lat,
  lng: s.lng,
  scoreResult: scoreSubstation(
    {
      id: String(i),
      name: s.name,
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
      lat: isValidCoord(s.lat, s.lng) ? s.lat : null,
      lng: isValidCoord(s.lat, s.lng) ? s.lng : null,
      mapped: isValidCoord(s.lat, s.lng),
      hasExactCoords: isValidCoord(s.lat, s.lng),
      approxLocation: false,
      coordPrecision: s.coord_precision,
      histProjects: s.hist_projects ?? 0,
      histWithdrawRate: s.hist_withdraw_rate,
      medianNetworkCostPerKw: s.median_network_cost_per_kw,
      nProjectsWithCost: s.n_projects_with_cost ?? 0,
      modelTier: s.model_tier,
      regionConcordance: s.region_concordance,
    },
    SCORE_INPUTS
  ),
}));

const NATIONAL_TERCILES = scoreTerciles(
  SCORED.map((s) => s.scoreResult?.score).filter((n) => n != null)
);

const [t0, t1] = NATIONAL_TERCILES;
const scoreOf = (s) => s.scoreResult?.score ?? -1;
const isRealSubstation = (name) =>
  name.toLowerCase().includes("substation") && !/\s[-–]\s/.test(name);
const EXCLUDED_STATES = new Set(["KS"]);

const scored = SCORED.filter(
  (s) =>
    s.scoreResult != null &&
    isValidCoord(s.lat, s.lng) &&
    isRealSubstation(s.name) &&
    !EXCLUDED_STATES.has(s.state)
);
const rich = scored.filter(
  (s) =>
    gridsolve.substations[s.index].median_network_cost_per_kw != null &&
    gridsolve.substations[s.index].hist_withdraw_rate != null
);
const pool = rich.length >= 18 ? rich : scored;

const usedRegions = new Set();
const chosen = [];
const take = (candidates, n, diverse = true) => {
  let count = 0;
  if (diverse) {
    for (const s of candidates) {
      if (count >= n) break;
      if (chosen.includes(s) || usedRegions.has(s.region)) continue;
      chosen.push(s);
      usedRegions.add(s.region);
      count++;
    }
  }
  for (const s of candidates) {
    if (count >= n) break;
    if (chosen.includes(s)) continue;
    chosen.push(s);
    usedRegions.add(s.region);
    count++;
  }
};

const mid = (t0 + t1) / 2;
const good = pool
  .filter((s) => scoreOf(s) > t1)
  .sort((a, b) => scoreOf(b) - scoreOf(a));
const bad = pool
  .filter((s) => scoreOf(s) <= t0)
  .sort((a, b) => scoreOf(a) - scoreOf(b));
const medium = pool
  .filter((s) => scoreOf(s) > t0 && scoreOf(s) <= t1)
  .sort(
    (a, b) => Math.abs(scoreOf(a) - mid) - Math.abs(scoreOf(b) - mid)
  );

take(good, 2);
take(medium, 2);
take(bad, 2, false);

if (chosen.length < 6) {
  const rest = pool
    .filter((s) => !chosen.includes(s))
    .sort((a, b) => scoreOf(b) - scoreOf(a));
  for (const s of rest) {
    if (chosen.length >= 6) break;
    chosen.push(s);
  }
}

for (const s of chosen.slice(0, 6)) {
  console.log(
    JSON.stringify({
      index: s.index,
      name: s.name,
      state: s.state,
      county: s.county,
      lat: s.lat,
      lng: s.lng,
      score: s.scoreResult?.score,
    })
  );
}
