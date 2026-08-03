import type { Substation, Status } from "./data-meta";

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
  [key: `hazard_${string}`]: number | null | undefined;
};

type RawGridSolve = {
  substations: RawSubstation[];
};

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
const US_CENTER: [number, number] = [39.5, -98.35];

function extractHazards(s: RawSubstation): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(s)) {
    if (k.startsWith("hazard_") && typeof v === "number" && Number.isFinite(v)) {
      out[k.slice("hazard_".length)] = v;
    }
  }
  return out;
}

function displayName(name: string): string {
  return name && name !== "undefined" ? name : "Unnamed substation";
}

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
    hazards: extractHazards(s),
  };
}

function jitter(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000 - 0.5;
}

function normalizeSubstations(raw: RawGridSolve): Substation[] {
  const rows = raw.substations.map((s, i) => normalize(s, i));

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

  for (const s of rows) {
    if (s.hasExactCoords) continue;
    const key = `${s.state}|${s.county}`;
    const county = countyCentroid[key];
    const base = county ?? STATE_CENTROIDS[s.state] ?? US_CENTER;
    const range = county ? 0.3 : 1.4;
    s.lat = base[0] + jitter(s.id, 1) * range;
    s.lng = base[1] + jitter(s.id, 7) * range;
    s.mapped = true;
    s.approxLocation = true;
  }

  return rows;
}

let loadPromise: Promise<Substation[]> | null = null;

export function loadSubstations(): Promise<Substation[]> {
  if (!loadPromise) {
    loadPromise = fetch("/data/gridsolve.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`);
        return res.json() as Promise<RawGridSolve>;
      })
      .then(normalizeSubstations);
  }
  return loadPromise;
}
