// One-off ingestion script: joins FEMA National Risk Index (NRI) county-level
// hazard scores onto data/gridsolve.json substations by state + county, and
// writes hazard_<name> fields (0-100, higher = worse) that src/lib/scores.ts
// reads for the RISK axis.
//
// Source: NRI_Table_Counties.csv, downloaded from
// https://hazards.fema.gov/nri/data-resources (December 2025 release).
// Run: node scripts/add-hazard-fields.mjs <path-to-NRI_Table_Counties.csv>
//
// County-name normalization: gridsolve.json strips "County"/"Borough" but
// keeps "Parish" (LA) and prefixes VA independent cities with "City Of " —
// NRI's COUNTY column has neither. We normalize both sides before matching.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRIDSOLVE_PATH = path.join(__dirname, "..", "data", "gridsolve.json");

const nriPath = process.argv[2];
if (!nriPath) {
  console.error("Usage: node scripts/add-hazard-fields.mjs <path-to-NRI_Table_Counties.csv>");
  process.exit(1);
}

// Formula key -> NRI column. IFLD (Inland Flooding) is the closest available
// match for "riverine_flood" in the Dec 2025 NRI release, which replaced the
// older single "Riverine Flooding" field with separate Inland/Coastal fields.
const HAZARD_COLUMNS = {
  earthquake: "ERQK_RISKS",
  wildfire: "WFIR_RISKS",
  hurricane: "HRCN_RISKS",
  riverine_flood: "IFLD_RISKS",
  tornado: "TRND_RISKS",
  heat_wave: "HWAV_RISKS",
  drought: "DRGT_RISKS",
};

function normalizeCounty(name) {
  if (!name) return "";
  return name
    .replace(/^city of\s+/i, "")
    .replace(/\s+(county|parish|borough|census area|municipality|municipio)$/i, "")
    .trim()
    .toLowerCase();
}

// Minimal CSV parser sufficient for NRI's export (no embedded commas inside
// quoted county/state names in practice, but quotes are still handled).
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = splitCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    if (cells.length !== header.length) continue;
    const row = {};
    for (let j = 0; j < header.length; j++) row[header[j]] = cells[j];
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

console.log("Reading NRI county table...");
const nriText = fs.readFileSync(nriPath, "utf-8");
const nriRows = parseCsv(nriText);
console.log(`  ${nriRows.length} county rows`);

// Build state|normalized-county -> { hazard_key: score } lookup. A handful of
// state/county pairs can repeat only if the source has duplicates; last one
// wins (NRI's county table has one row per county in practice).
const nriByKey = new Map();
for (const row of nriRows) {
  const state = row.STATEABBRV;
  const county = normalizeCounty(row.COUNTY);
  if (!state || !county) continue;
  const hazards = {};
  for (const [key, col] of Object.entries(HAZARD_COLUMNS)) {
    const v = parseFloat(row[col]);
    if (Number.isFinite(v)) hazards[key] = v;
  }
  nriByKey.set(`${state}|${county}`, hazards);
}

console.log("Reading gridsolve.json...");
const gridsolve = JSON.parse(fs.readFileSync(GRIDSOLVE_PATH, "utf-8"));
const subs = gridsolve.substations;
console.log(`  ${subs.length} substations`);

let matched = 0;
let unmatched = 0;
const unmatchedPairs = new Set();

for (const s of subs) {
  const key = `${s.state}|${normalizeCounty(s.county)}`;
  const hazards = nriByKey.get(key);
  if (hazards) {
    for (const [hk, score] of Object.entries(hazards)) {
      s[`hazard_${hk}`] = Math.round(score * 100) / 100;
    }
    matched++;
  } else {
    unmatched++;
    unmatchedPairs.add(`${s.state}|${s.county}`);
  }
}

console.log(`\nMatched: ${matched} / ${subs.length} substations`);
console.log(`Unmatched: ${unmatched} substations across ${unmatchedPairs.size} distinct state|county pairs`);
if (unmatchedPairs.size > 0) {
  console.log("Sample unmatched pairs:", [...unmatchedPairs].slice(0, 20));
}

// gridsolve.json ships minified (single line) — preserve that format rather
// than pretty-printing, so the diff is additive fields only, not a reflow.
fs.writeFileSync(GRIDSOLVE_PATH, JSON.stringify(gridsolve));
console.log(`\nWrote hazard_* fields into ${GRIDSOLVE_PATH}`);
