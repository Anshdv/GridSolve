// Builds data/summary.json (small, for server bundles) and copies the full
// dataset to public/ for client-side fetch in the explorer.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "data/gridsolve.json");
const summaryPath = path.join(root, "data/summary.json");
const publicPath = path.join(root, "public/data/gridsolve.json");

const raw = JSON.parse(fs.readFileSync(source, "utf8"));

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

const subs = raw.substations;
const presentRegions = new Set(subs.map((s) => s.region));
const availableRegions = [
  ...REGION_ORDER.filter((r) => presentRegions.has(r)),
  ...[...presentRegions].filter((r) => !REGION_ORDER.includes(r)).sort(),
];
const availableStates = [...new Set(subs.map((s) => s.state))].sort();

let exactCoords = 0;
let approxCoords = 0;
let activeQueue = 0;
let activeProjects = 0;
let queued = 0;
let withdraw = 0;

for (const s of subs) {
  const exact =
    isValidCoord(s.lat, s.lng) && s.coord_precision === "verified";
  if (exact) exactCoords++;
  else approxCoords++;
  if (s.status === "has_active_queue") {
    activeQueue++;
    activeProjects += s.n_projects ?? 0;
    queued += s.queued_mw ?? 0;
    withdraw += s.likely_withdraw_mw ?? 0;
  }
}

const summary = {
  model: raw.model,
  drivers: raw.drivers,
  availableRegions,
  availableStates,
  datasetStats: {
    total: subs.length,
    regions: availableRegions.length,
    states: availableStates.length,
    mapped: subs.length,
    exactCoords,
    approxCoords,
    activeQueue,
    activeProjects,
    nationalWithdrawalRate: queued > 0 ? withdraw / queued : 0,
  },
};

fs.mkdirSync(path.dirname(publicPath), { recursive: true });
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
fs.copyFileSync(source, publicPath);
console.log(`Wrote ${summaryPath} and ${publicPath}`);
