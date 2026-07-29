"use client";

// The demo. Map on the left, filterable/sortable substation list + detail
// panel on the right. All data comes from data/gridsolve.json via the data
// module — nothing fetched, nothing invented.
//
// The dataset is NATIONAL: ~4,700 substations across 9 ISO/RTO regions.
//
// MAP RULE: only substations with real (non-null) lat/lng are ever plotted —
// only ~12% carry coordinates, and they're never approximated. Markers are
// colored by GridSolve Site Score tercile (see src/lib/siteScore.ts), computed
// relative to the CURRENT filtered view — not an absolute scale. Filled
// marker = active queue (scored); hollow/gray = no active queue.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Map, {
  Layer,
  Source,
  MapRef,
  NavigationControl,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { CircleLayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  substations,
  availableRegions,
  availableStates,
  datasetStats,
  matchesCostBand,
} from "@/lib/data";
import {
  scoreInputs,
  scoreSubstation,
  scoreTerciles,
  scoreColor,
  type ScoredSubstation,
} from "@/lib/siteScore";
import FilterBar, {
  type Filters,
  type SortKey,
  type StatusFilter,
} from "@/components/explorer/FilterBar";
import SubstationList from "@/components/explorer/SubstationList";
import DetailPanel from "@/components/explorer/DetailPanel";
import CompareView from "@/components/explorer/CompareView";
import ExplorerTeaser from "@/components/explorer/ExplorerTeaser";
import TeaserContact from "@/components/explorer/TeaserContact";
import UserMenu from "@/components/auth/UserMenu";
import { useExplorerAccess } from "@/hooks/useExplorerAccess";

// Real dark vector basemap from OpenFreeMap — free, no API key, no signup.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

// Score inputs (median cost, queue-scale reference) are computed once over the
// whole national dataset so a site's score is stable regardless of how the
// user filters. The color BANDING (terciles), by contrast, is recomputed live
// against the current view — see the component below.
const SCORE_INPUTS = scoreInputs(substations);
const SCORED: ScoredSubstation[] = substations.map((s) => ({
  ...s,
  scoreResult: scoreSubstation(s, SCORE_INPUTS),
}));

const MAPPED = SCORED.filter((s) => s.mapped);

// Frame the opening view to every plotted station (a continental-US spread).
const INITIAL_BOUNDS = (() => {
  const lats = MAPPED.map((s) => s.lat as number);
  const lngs = MAPPED.map((s) => s.lng as number);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ] as [[number, number], [number, number]];
})();

// The list can match thousands of rows; render only the top slice (default
// sort is score-desc, so the most relevant are first) and prompt the user to
// refine. Keeps the DOM light without a virtualization dependency.
const LIST_RENDER_LIMIT = 250;

// National tercile cut points over all scored substations — the reference for
// the curated preview below (so "good/medium/bad" means the same thing here as
// the color banding a full-access user sees on the national view).
const NATIONAL_TERCILES = scoreTerciles(
  SCORED.map((s) => s.scoreResult?.score).filter((n): n is number => n != null)
);

// The free preview shows a hand-varied set: 2 strong (top third), 2 middling
// (middle third), 2 weak (bottom third), spread across as many regions as
// possible so a prospective user sees the range of what GridSolve scores — good
// AND bad sites, coast to coast — not just the winners.
const TEASER_SUBSTATIONS: ScoredSubstation[] = (() => {
  const [t0, t1] = NATIONAL_TERCILES;
  const scoreOf = (s: ScoredSubstation) => s.scoreResult?.score ?? -1;

  // Only actual substations, never transmission-line POIs. The dataset mixes
  // both; lines read like "WEST MEMPHIS EHV - KEO EHV 500.0kV" (an A - B pair),
  // while substations carry the word "substation". Require that word and
  // exclude the " - " line pattern so the preview shows real sites.
  const isRealSubstation = (name: string) =>
    name.toLowerCase().includes("substation") && !/\s[-–]\s/.test(name);

  // States to keep out of the preview (Kansas was a swapped-out example).
  const EXCLUDED_STATES = new Set(["KS"]);

  // REQUIRE verified coordinates: the map draws approximate (county/state)
  // positions faded, so the preview sites must have real lat/lng to render
  // bright. Prefer sites with full data so the detail panel is rich too.
  const scored = SCORED.filter(
    (s) =>
      s.scoreResult != null &&
      s.hasExactCoords &&
      isRealSubstation(s.name) &&
      !EXCLUDED_STATES.has(s.state)
  );
  const rich = scored.filter(
    (s) => s.medianNetworkCostPerKw != null && s.histWithdrawRate != null
  );
  const pool = rich.length >= 18 ? rich : scored;

  const usedRegions = new Set<string>();
  const chosen: ScoredSubstation[] = [];
  const take = (
    candidates: ScoredSubstation[],
    n: number,
    diverse = true
  ) => {
    let count = 0;
    // First prefer a not-yet-used region for geographic spread…
    if (diverse) {
      for (const s of candidates) {
        if (count >= n) break;
        if (chosen.includes(s) || usedRegions.has(s.region)) continue;
        chosen.push(s);
        usedRegions.add(s.region);
        count++;
      }
    }
    // …then fill by the candidate ordering (region diversity relaxed).
    for (const s of candidates) {
      if (count >= n) break;
      if (chosen.includes(s)) continue;
      chosen.push(s);
      usedRegions.add(s.region);
      count++;
    }
  };

  const mid = (t0 + t1) / 2;
  const good = pool.filter((s) => scoreOf(s) > t1).sort((a, b) => scoreOf(b) - scoreOf(a));
  const bad = pool.filter((s) => scoreOf(s) <= t0).sort((a, b) => scoreOf(a) - scoreOf(b));
  const medium = pool
    .filter((s) => scoreOf(s) > t0 && scoreOf(s) <= t1)
    .sort((a, b) => Math.abs(scoreOf(a) - mid) - Math.abs(scoreOf(b) - mid));

  take(good, 2); // 2 strong sites first (display order: good → bad)
  take(medium, 2);
  // The bad slots take the two LOWEST-scored sites outright (genuinely weak,
  // not just below the tercile line) — geographic diversity relaxed here.
  take(bad, 2, false);

  // Backfill from the highest-scored remaining pool if a band was too small.
  if (chosen.length < 6) {
    const rest = pool
      .filter((s) => !chosen.includes(s))
      .sort((a, b) => scoreOf(b) - scoreOf(a));
    for (const s of rest) {
      if (chosen.length >= 6) break;
      chosen.push(s);
    }
  }
  return chosen.slice(0, 6);
})();
const TEASER_IDS = new Set(TEASER_SUBSTATIONS.map((s) => s.id));

// The map draws all ~4,700 points, so they're rendered as a GPU circle layer
// (a maplibre GeoJSON source), not thousands of DOM markers. Per-feature
// properties carry the tercile `color`, whether the point is `active` (scored)
// and whether its position is `approx` (derived from county/state, drawn
// faded + smaller so it never masquerades as a verified location).
const POINT_LAYER_ID = "substation-points";
const POINT_LAYER: CircleLayerSpecification = {
  id: POINT_LAYER_ID,
  type: "circle",
  source: "substations",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      2,
      ["case", ["==", ["get", "approx"], 1], 1.4, 2.2],
      5,
      ["case", ["==", ["get", "approx"], 1], 2.8, 4],
      9,
      ["case", ["==", ["get", "approx"], 1], 5, 7],
    ],
    // Active = filled with its tercile color; no-active-queue = hollow.
    "circle-color": [
      "case",
      ["==", ["get", "active"], 1],
      ["get", "color"],
      "rgba(0,0,0,0)",
    ],
    "circle-opacity": ["case", ["==", ["get", "approx"], 1], 0.45, 0.9],
    "circle-stroke-width": ["case", ["==", ["get", "active"], 1], 1, 1.4],
    "circle-stroke-color": [
      "case",
      ["==", ["get", "active"], 1],
      "rgba(0,0,0,0.5)",
      ["get", "color"],
    ],
    "circle-stroke-opacity": ["case", ["==", ["get", "approx"], 1], 0.5, 0.9],
  },
};

const DEFAULT_FILTERS: Filters = {
  regions: [],
  state: "",
  status: "all",
  costBand: "any",
  exactOnly: false,
  search: "",
};

function matchesFilters(s: ScoredSubstation, f: Filters): boolean {
  if (f.regions.length > 0 && !f.regions.includes(s.region)) return false;
  if (f.state && s.state !== f.state) return false;
  if (f.status === "active" && !s.hasActiveQueue) return false;
  if (f.status === "history" && s.hasActiveQueue) return false;
  if (!matchesCostBand(s, f.costBand)) return false;
  if (f.exactOnly && !s.hasExactCoords) return false;
  const q = f.search.trim().toLowerCase();
  if (q && !s.name.toLowerCase().includes(q) && !s.county.toLowerCase().includes(q)) {
    return false;
  }
  return true;
}

// Null scores (no active queue) always sink to the bottom, regardless of
// sort direction — there's nothing to rank them by.
function sortSubstations(
  items: ScoredSubstation[],
  key: SortKey
): ScoredSubstation[] {
  const arr = [...items];
  switch (key) {
    case "score":
      return arr.sort(
        (a, b) => (b.scoreResult?.score ?? -1) - (a.scoreResult?.score ?? -1)
      );
    case "adjusted":
      return arr.sort((a, b) => b.adjustedMw - a.adjustedMw);
    case "cost":
      return arr.sort(
        (a, b) =>
          (a.medianNetworkCostPerKw ?? Infinity) -
          (b.medianNetworkCostPerKw ?? Infinity)
      );
    case "withdrawal":
      return arr.sort(
        (a, b) =>
          (a.histWithdrawRate ?? Infinity) - (b.histWithdrawRate ?? Infinity)
      );
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// Right-panel width as a percent of the split's total width — draggable
// between these bounds so the user can favor the map or the list/detail.
const PANEL_MIN_PCT = 25;
const PANEL_MAX_PCT = 70;
const PANEL_DEFAULT_PCT = 45;

export default function Explorer() {
  const mapRef = useRef<MapRef>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  // Holds substation ids (names are not unique nationally).
  const [selectedName, setSelectedName] = useState<string | null>(
    () => sortSubstations(SCORED, "score")[0]?.id ?? null
  );
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [compareNames, setCompareNames] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [panelPct, setPanelPct] = useState(PANEL_DEFAULT_PCT);
  const [mapCursor, setMapCursor] = useState("");
  const { ready: authReady, hasFullAccess } = useExplorerAccess();

  // Drag-to-resize the map/panel split (desktop only — mobile stacks
  // vertically and doesn't use this). Plain mouse listeners since the whole
  // app already avoids extra dependencies.
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((rect.right - e.clientX) / rect.width) * 100;
      setPanelPct(Math.min(PANEL_MAX_PCT, Math.max(PANEL_MIN_PCT, pct)));
    }
    function onUp() {
      if (draggingRef.current) {
        draggingRef.current = false;
        // Maplibre auto-resizes via ResizeObserver, but nudge it explicitly
        // right after a drag ends in case that's ever unavailable.
        mapRef.current?.resize();
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const filtered = useMemo(
    () => SCORED.filter((s) => matchesFilters(s, filters)),
    [filters]
  );
  const sorted = useMemo(
    () => sortSubstations(filtered, sortKey),
    [filtered, sortKey]
  );
  // Color banding is relative to the CURRENT view: terciles recompute from
  // whatever's filtered in, so filtering to one region rebalances the colors
  // to that region (the score numbers themselves stay stable).
  const terciles = useMemo(
    () =>
      scoreTerciles(
        filtered
          .map((s) => s.scoreResult?.score)
          .filter((n): n is number => n != null)
      ),
    [filtered]
  );
  // Which substations the map plots: the full filtered set for a full-access
  // user, or just the curated 6 for a preview user (so the map matches the
  // teaser list — a small, varied showcase rather than the whole country).
  const mapSource = hasFullAccess ? sorted : TEASER_SUBSTATIONS;

  // GeoJSON for the map's circle layer — plottable points with per-feature
  // color/active/approx.
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: mapSource
        .filter((s) => s.mapped)
        .map((s) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [s.lng as number, s.lat as number],
          },
          properties: {
            id: s.id,
            color: s.hasActiveQueue
              ? scoreColor(s.scoreResult?.score ?? null, terciles)
              : "#6b7280",
            active: s.hasActiveQueue ? 1 : 0,
            approx: s.approxLocation ? 1 : 0,
          },
        })),
    }),
    [mapSource, terciles]
  );
  // Only the top slice is rendered as DOM rows (see LIST_RENDER_LIMIT).
  const visibleRows = useMemo(
    () => sorted.slice(0, LIST_RENDER_LIMIT),
    [sorted]
  );

  const selected = useMemo(
    () => SCORED.find((s) => s.id === selectedName) ?? null,
    [selectedName]
  );
  // Preview users may only view details for the curated 6 (never an arbitrary
  // substation), so their detail panel is keyed off this guarded lookup.
  const teaserSelected = useMemo(
    () => TEASER_SUBSTATIONS.find((s) => s.id === selectedName) ?? null,
    [selectedName]
  );

  // When a preview user lands, default the selection to the first curated site
  // so a full detail breakdown is visible immediately (rather than a blank).
  useEffect(() => {
    if (authReady && !hasFullAccess && !TEASER_IDS.has(selectedName ?? "")) {
      setSelectedName(TEASER_SUBSTATIONS[0]?.id ?? null);
    }
    // Runs when access resolves; intentionally not re-run on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, hasFullAccess]);

  const compareSet = useMemo(() => new Set(compareNames), [compareNames]);
  const compareItems = useMemo(
    () =>
      compareNames
        .map((id) => SCORED.find((s) => s.id === id))
        .filter((s): s is ScoredSubstation => Boolean(s)),
    [compareNames]
  );

  function select(s: ScoredSubstation) {
    setSelectedName(s.id);
    if (s.mapped) {
      mapRef.current?.flyTo({
        center: [s.lng as number, s.lat as number],
        // Zoom in less for approximate (county/state) positions — they don't
        // warrant a precise-looking close-up.
        zoom: s.hasExactCoords ? 8.5 : 6,
        duration: 800,
      });
    }
  }

  // Clicking a circle on the map selects that substation.
  function onMapClick(e: MapLayerMouseEvent) {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    if (!id) return;
    const s = SCORED.find((x) => x.id === id);
    if (s) select(s);
  }

  function toggleCompare(id: string) {
    setCompareNames((prev) =>
      prev.includes(id)
        ? prev.filter((n) => n !== id)
        : prev.length >= 4
        ? prev
        : [...prev, id]
    );
  }

  function exportPrint() {
    window.print();
  }

  return (
    <main
      ref={splitRef}
      className="relative flex h-screen w-screen flex-col bg-[#0a0a0b] text-neutral-200 md:flex-row"
      style={
        {
          "--panel-w": `${panelPct}%`,
          "--map-w": `${100 - panelPct}%`,
        } as React.CSSProperties
      }
    >
      {/* Map */}
      <div className="no-print relative h-[45%] w-full md:h-full md:w-[var(--map-w)]">
        <Map
          ref={mapRef}
          mapStyle={MAP_STYLE}
          initialViewState={{
            bounds: INITIAL_BOUNDS,
            fitBoundsOptions: { padding: 56 },
          }}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={[POINT_LAYER_ID]}
          onClick={onMapClick}
          onMouseEnter={() => setMapCursor("pointer")}
          onMouseLeave={() => setMapCursor("")}
          cursor={mapCursor}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Source id="substations" type="geojson" data={geojson}>
            <Layer {...POINT_LAYER} />
            {/* White ring highlighting the selected substation. */}
            <Layer
              id="substation-selected"
              type="circle"
              filter={["==", ["get", "id"], selectedName ?? "__none__"]}
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  4,
                  5,
                  6.5,
                  9,
                  10,
                ],
                "circle-color": "rgba(0,0,0,0)",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2.5,
              }}
            />
          </Source>
        </Map>

        <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-4">
          <Link
            href="/"
            className="pointer-events-auto rounded-md border border-white/10 bg-[#0a0a0b]/80 px-3 py-1.5 text-sm text-neutral-300 backdrop-blur transition-colors hover:text-white"
          >
            ← GridSolve
          </Link>
          {/* mr-14 clears maplibre's NavigationControl (+/- zoom), which is
              its own absolutely-positioned element pinned to the map's
              top-right corner and would otherwise sit on top of these. */}
          <div className="pointer-events-auto mr-14 flex items-center gap-2">
            <Link
              href="/methodology"
              className="rounded-md border border-white/10 bg-[#0a0a0b]/80 px-3 py-1.5 text-xs text-neutral-300 backdrop-blur transition-colors hover:text-white"
            >
              Methodology
            </Link>
            <UserMenu />
          </div>
        </div>

        {/* Legend — colours mean the same thing on the map and in the list.
            Tercile cut points are computed at runtime from the CURRENT view
            (see `terciles` above), never hardcoded — the score is relative,
            not absolute. Collapsible so it can clear the markers underneath. */}
        <div className="absolute bottom-4 right-4 w-[15rem] max-w-[calc(100%-2rem)] overflow-hidden rounded-md border border-white/10 bg-[#0a0a0b]/85 text-[11px] backdrop-blur">
          <button
            onClick={() => setLegendCollapsed((c) => !c)}
            aria-expanded={!legendCollapsed}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
          >
            <span className="font-medium text-neutral-300">GridSolve Site Score</span>
            <ChevronToggle up={!legendCollapsed} />
          </button>

          {!legendCollapsed && (
            <div className="px-3 pb-2.5">
              <div className="mb-1.5 text-neutral-500">
                Interconnection suitability — top/middle/bottom third of the
                current view
              </div>
              {[
                { c: "#22c55e", l: "Top third", r: `> ${terciles[1]}` },
                {
                  c: "#f59e0b",
                  l: "Middle third",
                  // Scores can cluster tightly (many thin-evidence sites near
                  // 50); collapse the range to a single value when the band
                  // is one point wide rather than printing "52–52".
                  r:
                    terciles[1] > terciles[0] + 1
                      ? `${terciles[0] + 1}–${terciles[1]}`
                      : `${terciles[1]}`,
                },
                { c: "#ef4444", l: "Bottom third", r: `≤ ${terciles[0]}` },
                { c: "#6b7280", l: "No active queue", r: "not scored" },
              ].map((b) => (
                <div key={b.l} className="flex items-center gap-2 py-0.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: b.c }}
                  />
                  <span className="text-neutral-300">{b.l}</span>
                  <span className="ml-auto pl-3 font-mono text-neutral-500">
                    {b.r}
                  </span>
                </div>
              ))}
              <div className="mt-1.5 space-y-0.5 border-t border-white/10 pt-1.5 text-neutral-500">
                <div>Filled = active queue (scored) · hollow = no active queue</div>
                <div>Bright = verified location · faint = approximate</div>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 max-w-[15rem] rounded-md border border-white/10 bg-[#0a0a0b]/85 px-3 py-2 text-[11px] leading-relaxed text-neutral-400 backdrop-blur">
          {datasetStats.exactCoords.toLocaleString()} of{" "}
          {datasetStats.total.toLocaleString()} substations have verified
          coordinates. The rest are placed{" "}
          <span className="text-neutral-300">approximately</span> by county or
          state (shown faded) — a rough location, not a precise one.
        </div>
      </div>

      {/* Drag handle — desktop only (mobile stacks map/panel vertically, so
          a horizontal split has nothing to resize there). */}
      <div
        onMouseDown={() => {
          draggingRef.current = true;
        }}
        className="no-print relative z-20 hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-white/5 transition-colors hover:bg-blue-500/40 active:bg-blue-500/50 md:flex"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize map and panel"
      >
        <span className="h-8 w-0.5 rounded-full bg-white/20" />
      </div>

      {/* List + filters + detail */}
      <div className="flex h-[55%] w-full flex-col border-t border-white/5 md:h-full md:w-[var(--panel-w)] md:border-l-0 md:border-t-0">
        <div className="border-b border-white/5 px-5 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-sm font-semibold tracking-tight text-white">
              U.S. interconnection substations
            </h1>
            <span className="shrink-0 font-mono text-[11px] text-neutral-600">
              {datasetStats.regions} regions · {datasetStats.states} states
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
            {hasFullAccess ? (
              <>
                Ranked by GridSolve Site Score — a holistic read on interconnection
                suitability, relative to the current view. Model reliability
                varies by region; each panel shows the caveat.
              </>
            ) : (
              <>
                A free preview — a varied sample of sites across the country,
                with full scoring. The complete list, filters, and comparisons
                are unlocked by request.
              </>
            )}
          </p>
        </div>

        {hasFullAccess && compareNames.length > 0 && (
          <div className="no-print flex items-center justify-between gap-3 border-b border-white/5 bg-blue-500/[0.06] px-5 py-2.5 text-xs">
            <span className="text-neutral-300">
              {compareNames.length} selected to compare
              {compareNames.length >= 4 && " (max)"}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareOpen(true)}
                disabled={compareNames.length < 2}
                className="rounded border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 text-blue-300 transition-colors hover:border-blue-500/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Compare
              </button>
              <button
                onClick={() => setCompareNames([])}
                className="rounded border border-white/10 px-2.5 py-1 text-neutral-400 transition-colors hover:border-white/25 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {!authReady ? (
          <div className="flex flex-1 items-center justify-center px-8 py-16 text-sm text-neutral-600">
            Loading…
          </div>
        ) : hasFullAccess ? (
          <>
            <div className="no-print">
              <FilterBar
                availableRegions={availableRegions}
                availableStates={availableStates}
                filters={filters}
                onFiltersChange={setFilters}
                sortKey={sortKey}
                onSortChange={setSortKey}
                shown={sorted.length}
                total={substations.length}
              />
            </div>

            <SubstationList
              items={visibleRows}
              hiddenCount={sorted.length - visibleRows.length}
              terciles={terciles}
              selectedName={selectedName}
              compareSet={compareSet}
              compareFull={compareNames.length >= 4}
              onSelect={select}
              onToggleCompare={toggleCompare}
            />

            {selected && !compareOpen && (
              <div
                className={`shrink-0 overflow-y-auto ${
                  detailCollapsed ? "" : "max-h-[46%]"
                }`}
              >
                <DetailPanel
                  s={selected}
                  terciles={terciles}
                  collapsed={detailCollapsed}
                  onToggleCollapsed={() => setDetailCollapsed((c) => !c)}
                  onExport={exportPrint}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* One smooth scroll: the preview rows and the selected site's
                full detail flow together in a single column (no nested,
                fighting scroll regions), with the contact bar pinned below. */}
            <div className="flex-1 overflow-y-auto">
              <ExplorerTeaser
                items={TEASER_SUBSTATIONS}
                terciles={terciles}
                selectedName={selectedName}
                onSelect={select}
              />
              {teaserSelected && (
                <DetailPanel
                  s={teaserSelected}
                  terciles={terciles}
                  collapsed={detailCollapsed}
                  onToggleCollapsed={() => setDetailCollapsed((c) => !c)}
                  onExport={exportPrint}
                />
              )}
            </div>

            <TeaserContact
              previewCount={TEASER_SUBSTATIONS.length}
              total={substations.length}
            />
          </>
        )}
      </div>

      {hasFullAccess && compareOpen && compareItems.length >= 2 && (
        <CompareView
          items={compareItems}
          terciles={terciles}
          onRemove={(id) =>
            setCompareNames((prev) => prev.filter((n) => n !== id))
          }
          onClear={() => {
            setCompareNames([]);
            setCompareOpen(false);
          }}
          onClose={() => setCompareOpen(false)}
          onExport={exportPrint}
        />
      )}
    </main>
  );
}

// Small caret that flips between expanded (up) and collapsed (down) — used by
// the map legend's collapse toggle.
function ChevronToggle({ up }: { up: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-neutral-500 transition-transform ${up ? "" : "rotate-180"}`}
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

// Re-export types other modules may want (kept for the filter bar's props).
export type { Filters, SortKey, StatusFilter };
