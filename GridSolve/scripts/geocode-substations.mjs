#!/usr/bin/env node
/**
 * Re-geocode substations in data/gridsolve.json.
 *
 * Priority:
 *   1. HIFLD inventory (name + state fuzzy match)
 *   2. OpenStreetMap Overpass (power=substation in state)
 *   3. Nominatim geocoding fallback
 *
 * Preserves the 6 curated teaser preview sites.
 * Writes a resumable cache so interrupted runs continue where they left off.
 *
 * Usage:
 *   node scripts/geocode-substations.mjs
 *   node scripts/geocode-substations.mjs --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data/gridsolve.json");
const HIFLD_CACHE = path.join(ROOT, "data/hifld_substations_us.json");
const GEO_CACHE = path.join(ROOT, "data/geocode-cache.json");
const REPORT_PATH = path.join(ROOT, "data/geocode-report.json");

const DRY_RUN = process.argv.includes("--dry-run");
const NOMINATIM_DELAY_MS = 1100;
const OVERPASS_DELAY_MS = 800;

const TEASER_INDICES = new Set([705, 7, 221, 273, 4154, 2967]);

const HIFLD_URL =
  "https://gis.elpasotexas.gov/dev/rest/services/source_HIFLD_Open/MapServer/5/query";

const STATE_BOUNDS = {
  AL: { lat: [30.1, 35.0], lng: [-88.5, -84.9] },
  AR: { lat: [33.0, 36.5], lng: [-94.6, -89.6] },
  AZ: { lat: [31.3, 37.0], lng: [-114.8, -109.0] },
  CA: { lat: [32.5, 42.0], lng: [-124.5, -114.1] },
  CO: { lat: [37.0, 41.0], lng: [-109.1, -102.0] },
  CT: { lat: [41.0, 42.1], lng: [-73.7, -71.8] },
  DC: { lat: [38.79, 38.99], lng: [-77.12, -76.91] },
  DE: { lat: [38.45, 39.84], lng: [-75.79, -75.05] },
  FL: { lat: [24.5, 31.0], lng: [-87.6, -80.0] },
  GA: { lat: [30.4, 35.0], lng: [-85.6, -80.8] },
  IA: { lat: [40.4, 43.5], lng: [-96.6, -90.1] },
  ID: { lat: [42.0, 49.0], lng: [-117.2, -111.0] },
  IL: { lat: [37.0, 42.5], lng: [-91.5, -87.5] },
  IN: { lat: [37.8, 41.8], lng: [-88.1, -84.8] },
  KS: { lat: [37.0, 40.0], lng: [-102.1, -94.6] },
  KY: { lat: [36.5, 39.2], lng: [-89.6, -82.0] },
  LA: { lat: [29.0, 33.0], lng: [-94.0, -89.0] },
  MA: { lat: [41.2, 42.9], lng: [-73.5, -69.9] },
  MD: { lat: [37.9, 39.7], lng: [-79.5, -75.0] },
  ME: { lat: [43.0, 47.5], lng: [-71.1, -66.9] },
  MI: { lat: [41.7, 48.3], lng: [-90.4, -82.4] },
  MN: { lat: [43.5, 49.4], lng: [-97.2, -89.5] },
  MO: { lat: [36.0, 40.6], lng: [-95.8, -89.1] },
  MS: { lat: [30.2, 35.0], lng: [-91.7, -88.1] },
  MT: { lat: [44.4, 49.0], lng: [-116.1, -104.0] },
  NC: { lat: [33.8, 36.6], lng: [-84.3, -75.5] },
  ND: { lat: [45.9, 49.0], lng: [-104.1, -96.6] },
  NE: { lat: [40.0, 43.0], lng: [-104.1, -95.3] },
  NH: { lat: [42.7, 45.3], lng: [-72.6, -70.6] },
  NJ: { lat: [38.9, 41.4], lng: [-75.6, -73.9] },
  NM: { lat: [31.3, 37.0], lng: [-109.1, -103.0] },
  NV: { lat: [35.0, 42.0], lng: [-120.0, -114.0] },
  NY: { lat: [40.5, 45.0], lng: [-79.8, -71.9] },
  OH: { lat: [38.4, 42.0], lng: [-84.8, -80.5] },
  OK: { lat: [33.6, 37.0], lng: [-103.0, -94.4] },
  OR: { lat: [42.0, 46.3], lng: [-124.6, -116.5] },
  PA: { lat: [39.7, 42.3], lng: [-80.5, -74.7] },
  RI: { lat: [41.1, 42.0], lng: [-71.9, -71.1] },
  SC: { lat: [32.0, 35.2], lng: [-83.4, -78.5] },
  SD: { lat: [42.5, 45.9], lng: [-104.1, -96.4] },
  TN: { lat: [35.0, 36.7], lng: [-90.3, -81.6] },
  TX: { lat: [25.8, 36.5], lng: [-106.6, -93.5] },
  UT: { lat: [37.0, 42.0], lng: [-114.1, -109.0] },
  VA: { lat: [36.5, 39.5], lng: [-83.7, -75.2] },
  VT: { lat: [42.7, 45.0], lng: [-73.4, -71.5] },
  WA: { lat: [45.5, 49.0], lng: [-124.8, -116.9] },
  WI: { lat: [42.5, 47.1], lng: [-92.9, -86.8] },
  WV: { lat: [37.2, 40.6], lng: [-82.6, -77.7] },
  WY: { lat: [41.0, 45.0], lng: [-111.1, -104.0] },
  MX: { lat: [14.5, 32.7], lng: [-118.4, -86.7] },
};

const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  IA: "Iowa", ID: "Idaho", IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan",
  MN: "Minnesota", MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina",
  ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia",
  VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normText(s) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+\.?\d*\s*kv/g, " ")
    .replace(
      /\b(substation|switching station|switchyard|sub\.?|ss\b|yard|ehv|tap|new|existing|proposed|line|transmission|plant|generating station)\b/g,
      " "
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normCounty(s) {
  return normText(s).replace(/\b(parish|county|co)\b/g, "").trim();
}

function tokens(s) {
  return new Set(
    normText(s)
      .split(" ")
      .filter((w) => w.length > 2 && !["the", "and", "near"].includes(w))
  );
}

function primaryName(sub) {
  let name = sub.name.replace(/\([^)]*\)/g, " ").trim();
  const line = name.match(/^(.+?)\s[-–—]\s/);
  if (line) name = line[1].trim();
  return name
    .replace(/\d+\.?\d*\s*kv/gi, " ")
    .replace(/\b(substation|sub\.?|ss\b)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokens(sub) {
  const t = tokens(primaryName(sub));
  // Prefer distinctive tokens (drop generic power words)
  return [...t].filter((w) => !["kv", "ehv", "line", "tap"].includes(w)).slice(0, 3);
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function inState(lat, lng, state) {
  const b = STATE_BOUNDS[state];
  if (!b) return true;
  return lat >= b.lat[0] && lat <= b.lat[1] && lng >= b.lng[0] && lng <= b.lng[1];
}

function isValidCoord(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function roundCoord(n) {
  return Math.round(n * 1e6) / 1e6;
}

function loadCache() {
  if (!fs.existsSync(GEO_CACHE)) return {};
  return JSON.parse(fs.readFileSync(GEO_CACHE, "utf8"));
}

function saveCache(cache) {
  fs.writeFileSync(GEO_CACHE, JSON.stringify(cache, null, 2));
}

async function fetchHifldPage(offset) {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "NAME,STATE,LATITUDE,LONGITUDE,COUNTY",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
    resultOffset: String(offset),
    resultRecordCount: "2000",
  });
  const res = await fetch(`${HIFLD_URL}?${params}`);
  if (!res.ok) throw new Error(`HIFLD fetch failed: ${res.status}`);
  return res.json();
}

async function loadHifld() {
  if (fs.existsSync(HIFLD_CACHE)) {
    console.log("Using cached HIFLD data");
    return JSON.parse(fs.readFileSync(HIFLD_CACHE, "utf8"));
  }
  console.log("Downloading HIFLD substations…");
  const features = [];
  let offset = 0;
  while (true) {
    const page = await fetchHifldPage(offset);
    features.push(...(page.features ?? []));
    if (!page.exceededTransferLimit && !page.properties?.exceededTransferLimit) break;
    offset += 2000;
    await sleep(200);
  }
  const payload = { type: "FeatureCollection", features };
  fs.writeFileSync(HIFLD_CACHE, JSON.stringify(payload));
  return payload;
}

function buildHifldIndex(hifld) {
  const byState = new Map();
  for (const f of hifld.features) {
    const p = f.properties ?? {};
    const state = (p.STATE ?? "").trim().toUpperCase();
    if (!state) continue;
    const [lng, lat] = f.geometry?.coordinates ?? [];
    if (!isValidCoord(lat, lng)) continue;
    const rec = {
      name: p.NAME ?? "",
      state,
      county: p.COUNTY ?? "",
      lat,
      lng,
      norm: normText(p.NAME),
      tokens: tokens(p.NAME),
      countyNorm: normCounty(p.COUNTY),
    };
    if (!byState.has(state)) byState.set(state, []);
    byState.get(state).push(rec);
  }
  return byState;
}

function matchHifld(sub, byState) {
  const pool = byState.get(sub.state?.toUpperCase()) ?? [];
  if (!pool.length) return null;

  const subNorm = normText(sub.name);
  const subTokens = tokens(sub.name);
  const subCounty = normCounty(sub.county);

  let best = null;
  let bestScore = 0;
  for (const rec of pool) {
    let score = subNorm && rec.norm && subNorm === rec.norm ? 1 : jaccard(subTokens, rec.tokens);
    if (subCounty && rec.countyNorm) {
      if (subCounty === rec.countyNorm) score += 0.2;
      else if (subCounty.includes(rec.countyNorm) || rec.countyNorm.includes(subCounty))
        score += 0.1;
      else score -= 0.08;
    }
    if (subNorm && rec.norm && (subNorm.includes(rec.norm) || rec.norm.includes(subNorm)))
      score += 0.12;
    if (score > bestScore) {
      bestScore = score;
      best = rec;
    }
  }
  if (!best || bestScore < 0.42) return null;
  return { lat: best.lat, lng: best.lng, source: `hifld:${best.name}`, score: bestScore };
}

async function queryOverpass(sub) {
  const state = sub.state;
  const search = searchTokens(sub);
  if (!search.length) return null;

  const regex = search.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  const query = `
    [out:json][timeout:25];
    area["ISO3166-2"="US-${state}"][admin_level=4]->.state;
    (
      node["power"="substation"]["name"~"${regex}",i](area.state);
      way["power"="substation"]["name"~"${regex}",i](area.state);
      relation["power"="substation"]["name"~"${regex}",i](area.state);
    );
    out center 5;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) return null;
  const data = await res.json();
  const elements = data.elements ?? [];
  if (!elements.length) return null;

  const subCounty = normCounty(sub.county);
  let best = null;
  let bestScore = 0;

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!isValidCoord(lat, lng) || !inState(lat, lng, state)) continue;

    const name = el.tags?.name ?? "";
    const score = jaccard(tokens(sub.name), tokens(name));
    let total = score;
    const addr = normText(el.tags?.["addr:county"] ?? "");
    if (subCounty && addr && (addr.includes(subCounty) || subCounty.includes(addr))) total += 0.15;

    if (total > bestScore) {
      bestScore = total;
      best = { lat, lng, source: `osm:${name}`, score: total };
    }
  }

  if (!best || bestScore < 0.25) return null;
  return best;
}

function buildNominatimQueries(sub) {
  const clean = primaryName(sub);
  const county = sub.county?.replace(/\s+Parish$/i, "") ?? "";
  const stateName = STATE_NAMES[sub.state] ?? sub.state;
  const queries = [];

  if (county) {
    queries.push(`${clean} electric substation, ${county} County, ${stateName}, USA`);
    queries.push(`${clean}, ${county}, ${stateName}, USA`);
  }
  queries.push(`${clean} substation, ${stateName}, USA`);
  queries.push(`${clean}, ${stateName}, USA`);

  const lineMatch = sub.name.match(/^(.+?)\s[-–—]\s(.+?)(?:\s+\d|$)/i);
  if (lineMatch) {
    for (const side of [lineMatch[1], lineMatch[2]]) {
      const sideClean = side.trim().replace(/\d+\.?\d*\s*kv/gi, " ").trim();
      queries.push(`${sideClean} substation, ${stateName}, USA`);
    }
  }

  return [...new Set(queries.filter(Boolean))];
}

async function geocodeNominatim(query, state) {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "us",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      "User-Agent": "GridSolve/1.0 (substation geocoding)",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.length) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (!isValidCoord(lat, lng) || !inState(lat, lng, state)) return null;
  return { lat, lng, source: `nominatim:${query}` };
}

async function resolveSubstation(sub, index, byState, cache, stats) {
  const cacheKey = String(index);
  if (cache[cacheKey]) {
    stats.cached++;
    return cache[cacheKey];
  }

  if (TEASER_INDICES.has(index)) {
    stats.skippedTeaser++;
    return {
      lat: sub.lat,
      lng: sub.lng,
      coord_precision: sub.coord_precision ?? "verified",
      geocode_source: "teaser_preserved",
    };
  }

  const hifld = matchHifld(sub, byState);
  if (hifld && inState(hifld.lat, hifld.lng, sub.state)) {
    stats.hifld++;
    const result = {
      lat: roundCoord(hifld.lat),
      lng: roundCoord(hifld.lng),
      coord_precision: "verified",
      geocode_source: hifld.source,
    };
    cache[cacheKey] = result;
    saveCache(cache);
    return result;
  }

  await sleep(OVERPASS_DELAY_MS);
  stats.overpassAttempts++;
  const osm = await queryOverpass(sub);
  if (osm) {
    stats.overpass++;
    const result = {
      lat: roundCoord(osm.lat),
      lng: roundCoord(osm.lng),
      coord_precision: "verified",
      geocode_source: osm.source,
    };
    cache[cacheKey] = result;
    saveCache(cache);
    return result;
  }

  for (const q of buildNominatimQueries(sub)) {
    await sleep(NOMINATIM_DELAY_MS);
    stats.nominatimAttempts++;
    const hit = await geocodeNominatim(q, sub.state);
    if (hit) {
      stats.nominatim++;
      const result = {
        lat: roundCoord(hit.lat),
        lng: roundCoord(hit.lng),
        coord_precision: "verified",
        geocode_source: hit.source,
      };
      cache[cacheKey] = result;
      saveCache(cache);
      return result;
    }
  }

  stats.failed++;
  const result = { lat: null, lng: null, coord_precision: null, geocode_source: null };
  cache[cacheKey] = result;
  saveCache(cache);
  return result;
}

async function main() {
  const gridsolve = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const hifld = await loadHifld();
  const byState = buildHifldIndex(hifld);
  const cache = loadCache();

  const stats = {
    total: gridsolve.substations.length,
    skippedTeaser: 0,
    cached: 0,
    hifld: 0,
    overpass: 0,
    overpassAttempts: 0,
    nominatim: 0,
    nominatimAttempts: 0,
    failed: 0,
    updated: 0,
    unchanged: 0,
  };

  const report = [];

  for (let i = 0; i < gridsolve.substations.length; i++) {
    const sub = gridsolve.substations[i];
    const resolved = await resolveSubstation(sub, i, byState, cache, stats);

    const prev = { lat: sub.lat, lng: sub.lng };
    const changed =
      resolved.lat !== sub.lat ||
      resolved.lng !== sub.lng ||
      (resolved.coord_precision && resolved.coord_precision !== sub.coord_precision);

    if (changed && (resolved.lat != null || TEASER_INDICES.has(i))) {
      report.push({
        index: i,
        name: sub.name,
        state: sub.state,
        county: sub.county,
        prev,
        next: { lat: resolved.lat, lng: resolved.lng },
        source: resolved.geocode_source,
      });
    }

    if (!changed) {
      stats.unchanged++;
    } else if (!DRY_RUN) {
      sub.lat = resolved.lat;
      sub.lng = resolved.lng;
      sub.coord_precision = resolved.coord_precision;
      stats.updated++;
    } else {
      stats.updated++;
    }

    if ((i + 1) % 20 === 0) {
      console.log(
        `[${i + 1}/${gridsolve.substations.length}] hifld=${stats.hifld} osm=${stats.overpass} nom=${stats.nominatim} fail=${stats.failed} cached=${stats.cached}`
      );
    }
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify({ stats, report: report.slice(0, 500) }, null, 2));

  if (!DRY_RUN) {
    gridsolve.model.coord_source =
      "HIFLD + OpenStreetMap/Nominatim geocoding (6 teaser preview sites preserved)";
    fs.writeFileSync(DATA_PATH, JSON.stringify(gridsolve, null, 2));
    console.log(`Updated ${DATA_PATH}`);
  } else {
    console.log("Dry run — gridsolve.json not modified");
  }

  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
