"use client";

// The demo. Map on the left, filterable/sortable substation list + detail
// panel on the right. Substation data is fetched from /data/gridsolve.json
// at runtime so the Cloudflare Worker bundle stays under size limits.
//
// The dataset is NATIONAL: ~4,700 substations across 9 ISO/RTO regions.
//
// MAP RULE: only substations with real (non-null) lat/lng are ever plotted —
// only ~12% carry coordinates, and they're never approximated. Markers are
// colored by GridSolve Site Score tercile (see src/lib/siteScore.ts), computed
// relative to the CURRENT filtered view — not an absolute scale. Filled
// marker = active queue (scored); hollow/gray = no active queue.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Map, {
  Layer,
  Source,
  Popup,
  MapRef,
  NavigationControl,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { CircleLayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  availableRegions,
  availableStates,
  datasetStats,
  matchesCostBand,
  tierMeta,
} from "@/lib/data-meta";
import { loadSubstations } from "@/lib/data-load";
import {
  buildInitialBounds,
  buildNationalTerciles,
  buildTeaserSubstations,
} from "@/lib/explorer-data";
import {
  scoreInputs,
  scoreSubstation,
  scoreTerciles,
  type ScoredSubstation,
} from "@/lib/siteScore";
import {
  makeScoreOf,
  axisValue,
  axisColor,
  terciles as axisTercilesOf,
  AXIS_LABEL,
  AXIS_COLOR_TOP,
  AXIS_COLOR_MID,
  AXIS_COLOR_LOW,
  AXIS_COLOR_NONE,
  type Axis,
  type TwoAxisScore,
} from "@/lib/scores";
import FilterBar, {
  SORT_OPTIONS,
  type Filters,
  type SortKey,
  type StatusFilter,
} from "@/components/explorer/FilterBar";
import SubstationList from "@/components/explorer/SubstationList";
import DetailPanel from "@/components/explorer/DetailPanel";
import CompareView from "@/components/explorer/CompareView";
import TeaserContact from "@/components/explorer/TeaserContact";
import SiteNav from "@/components/SiteNav";
import { ExplorerScoreProvider } from "@/components/explorer/ExplorerScoreContext";
import { useExplorerAccess } from "@/hooks/useExplorerAccess";
import { downloadCatalogCsv } from "@/lib/exportCatalogCsv";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";
const LIST_RENDER_LIMIT = 250;
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
  key: SortKey,
  scoreOf: (s: ScoredSubstation) => TwoAxisScore
): ScoredSubstation[] {
  const arr = [...items];
  // Two-axis sorts — null values (no data on that axis) always sink to the
  // bottom regardless of direction, since there's nothing to rank them by.
  const byAxis = (axis: Axis) =>
    arr.sort(
      (a, b) =>
        (axisValue(scoreOf(b), axis) ?? -1) - (axisValue(scoreOf(a), axis) ?? -1)
    );
  switch (key) {
    case "combined":
      return byAxis("combined");
    case "power":
      return byAxis("power");
    case "risk":
      return byAxis("risk");
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
  const [scored, setScored] = useState<ScoredSubstation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("power");
  // Which axis colors the map + drives its legend: Power | Risk | Combined.
  const [axis, setAxis] = useState<Axis>("power");
  const [compareNames, setCompareNames] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [panelPct, setPanelPct] = useState(PANEL_DEFAULT_PCT);
  const [mapCursor, setMapCursor] = useState("");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const router = useRouter();
  const { ready: authReady, plan, hasFullAccess } = useExplorerAccess();

  useEffect(() => {
    if (!plan.canSeeRisk && (axis === "risk" || axis === "combined")) {
      setAxis("power");
      if (sortKey === "risk" || sortKey === "combined") setSortKey("power");
    }
    if (!plan.canCompare) {
      setCompareNames([]);
      setCompareOpen(false);
    }
  }, [plan.canSeeRisk, plan.canCompare, axis, sortKey]);

  useEffect(() => {
    let cancelled = false;
    loadSubstations()
      .then((substations) => {
        if (cancelled) return;
        const inputs = scoreInputs(substations);
        const nextScored = substations.map((s) => ({
          ...s,
          scoreResult: scoreSubstation(s, inputs),
        }));
        setScored(nextScored);
        setSelectedName(
          sortSubstations(nextScored, "power", makeScoreOf(inputs))[0]?.id ??
            null
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load substation data"
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scoreOf = useMemo(
    () => (scored ? makeScoreOf(scoreInputs(scored)) : null),
    [scored]
  );

  const initialBounds = useMemo(
    () =>
      scored
        ? buildInitialBounds(scored.filter((s) => s.mapped))
        : ([
            [-125, 24],
            [-66, 50],
          ] as [[number, number], [number, number]]),
    [scored]
  );

  const nationalTerciles = useMemo(
    () => (scored ? buildNationalTerciles(scored) : ([0, 0] as [number, number])),
    [scored]
  );

  const teaserSubstations = useMemo(
    () => (scored ? buildTeaserSubstations(scored, nationalTerciles) : []),
    [scored, nationalTerciles]
  );

  const teaserIds = useMemo(
    () => new Set(teaserSubstations.map((s) => s.id)),
    [teaserSubstations]
  );

  const totalCount = scored?.length ?? datasetStats.total;

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
    () => (scored ?? []).filter((s) => matchesFilters(s, filters)),
    [scored, filters]
  );
  const sorted = useMemo(
    () =>
      scoreOf ? sortSubstations(filtered, sortKey, scoreOf) : filtered,
    [filtered, sortKey, scoreOf]
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
  // Per-axis terciles for the SELECTED axis, recomputed against the current
  // view — colors the map markers and its legend. Null values (no data on this
  // axis) are excluded from the banding.
  const axisTerciles = useMemo(
    () =>
      scoreOf
        ? axisTercilesOf(
            filtered
              .map((s) => axisValue(scoreOf(s), axis))
              .filter((n): n is number => n != null)
          )
        : ([0, 0] as [number, number]),
    [filtered, axis, scoreOf]
  );
  const allAxisTerciles = useMemo(() => {
    if (!scoreOf) {
      return {
        power: [0, 0],
        risk: [0, 0],
        combined: [0, 0],
      } as Record<Axis, [number, number]>;
    }
    const vals = (a: Axis) =>
      filtered
        .map((s) => axisValue(scoreOf(s), a))
        .filter((n): n is number => n != null);
    return {
      power: axisTercilesOf(vals("power")),
      risk: axisTercilesOf(vals("risk")),
      combined: axisTercilesOf(vals("combined")),
    } as Record<Axis, [number, number]>;
  }, [filtered, scoreOf]);
  // Teaser list uses the same sort as the full explorer (FilterBar sortKey,
  // kept in sync with the map's Power/Risk/Combined axis toggle below).
  const teaserSorted = useMemo(
    () =>
      scoreOf
        ? sortSubstations(teaserSubstations, sortKey, scoreOf)
        : teaserSubstations,
    [teaserSubstations, sortKey, scoreOf]
  );
  const mapSource = hasFullAccess ? sorted : teaserSorted;

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
            color: scoreOf
              ? axisColor(axisValue(scoreOf(s), axis), axisTerciles)
              : AXIS_COLOR_NONE,
            active: scoreOf && axisValue(scoreOf(s), axis) != null ? 1 : 0,
            approx: s.approxLocation ? 1 : 0,
            concordance: s.regionConcordance,
            tier: s.modelTier,
          },
        })),
    }),
    [mapSource, axis, axisTerciles, scoreOf]
  );
  // Only the top slice is rendered as DOM rows (see LIST_RENDER_LIMIT).
  const visibleRows = useMemo(
    () => sorted.slice(0, LIST_RENDER_LIMIT),
    [sorted]
  );

  const selected = useMemo(
    () => scored?.find((s) => s.id === selectedName) ?? null,
    [scored, selectedName]
  );
  const hovered = useMemo(
    () => scored?.find((s) => s.id === hoverId) ?? null,
    [scored, hoverId]
  );
  const teaserSelected = useMemo(
    () => teaserSubstations.find((s) => s.id === selectedName) ?? null,
    [teaserSubstations, selectedName]
  );

  useEffect(() => {
    if (
      authReady &&
      !hasFullAccess &&
      scored &&
      scoreOf &&
      !teaserIds.has(selectedName ?? "")
    ) {
      setSelectedName(
        sortSubstations(teaserSubstations, "power", scoreOf)[0]?.id ?? null
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, hasFullAccess, scored]);

  const compareSet = useMemo(() => new Set(compareNames), [compareNames]);
  const compareItems = useMemo(
    () =>
      compareNames
        .map((id) => scored?.find((s) => s.id === id))
        .filter((s): s is ScoredSubstation => Boolean(s)),
    [compareNames, scored]
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
    const s = scored?.find((x) => x.id === id);
    if (s) select(s);
  }

  function onMapMouseMove(e: MapLayerMouseEvent) {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    setHoverId(id ?? null);
    setMapCursor(id ? "pointer" : "");
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

  function exportCsv() {
    if (!plan.canExport || !scoreOf || !sorted.length) return;
    downloadCatalogCsv(sorted, scoreOf, plan.canSeeRisk);
  }

  if (loadError) {
    return (
      <main className="flex h-screen flex-col bg-[#0a0a0b]">
        <SiteNav variant="explorer" />
        <div className="flex flex-1 items-center justify-center px-8 text-sm text-red-400">
          {loadError}
        </div>
      </main>
    );
  }

  if (!scored || !scoreOf) {
    return (
      <main className="flex h-screen flex-col bg-[#0a0a0b]">
        <SiteNav variant="explorer" />
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading substation data…
        </div>
      </main>
    );
  }

  return (
    <ExplorerScoreProvider scoreOf={scoreOf}>
    <main className="flex h-screen w-screen flex-col bg-[#0a0a0b] text-neutral-200">
      <SiteNav variant="explorer" />
      <div
        ref={splitRef}
        className="relative flex min-h-0 flex-1 flex-col md:flex-row"
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
            bounds: initialBounds,
            fitBoundsOptions: { padding: 56 },
          }}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={[POINT_LAYER_ID]}
          onClick={onMapClick}
          onMouseMove={onMapMouseMove}
          onMouseLeave={() => {
            setHoverId(null);
            setMapCursor("");
          }}
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
          {hovered?.mapped && hovered.lng != null && hovered.lat != null && (
            <Popup
              longitude={hovered.lng}
              latitude={hovered.lat}
              closeButton={false}
              closeOnClick={false}
              offset={12}
              className="gs-map-popup"
              maxWidth="220px"
            >
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-white">
                  {hovered.name}
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-400">
                  {hovered.county}, {hovered.state}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-px font-tele text-[9px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: tierMeta(hovered.modelTier).color + "22",
                      color: tierMeta(hovered.modelTier).color,
                    }}
                  >
                    {tierMeta(hovered.modelTier).label}
                  </span>
                  <span className="font-tele text-[11px] tabular-nums text-neutral-300">
                    {hovered.regionConcordance != null
                      ? `${hovered.region} ${hovered.regionConcordance.toFixed(3)}`
                      : hovered.region}
                  </span>
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Axis toggle — recolors the markers and the legend by Power, Risk,
            or Combined, and keeps the list sorted by the same axis. */}
        <div className="pointer-events-none absolute left-14 right-0 top-4 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-1 rounded-md border border-white/10 bg-[#0a0a0b]/85 p-1 text-[11px] backdrop-blur">
            {(["power", "risk", "combined"] as Axis[]).map((a) => {
              const locked = !plan.canSeeRisk && a !== "power";
              return (
                <button
                  key={a}
                  onClick={() => {
                    if (locked) {
                      router.push("/pricing");
                      return;
                    }
                    setAxis(a);
                    setSortKey(a);
                  }}
                  aria-pressed={axis === a}
                  title={locked ? "Diligence license" : undefined}
                  className={`rounded px-2.5 py-1 font-medium transition-colors ${
                    axis === a
                      ? "bg-white/15 text-white"
                      : locked
                        ? "text-neutral-600"
                        : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {AXIS_LABEL[a]}
                  {locked ? " · diligence" : ""}
                </button>
              );
            })}
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
            <span className="font-medium text-neutral-300">
              {AXIS_LABEL[axis]} score
            </span>
            <ChevronToggle up={!legendCollapsed} />
          </button>

          {!legendCollapsed && (
            <div className="px-3 pb-2.5">
              <div className="mb-1.5 text-neutral-500">
                {axis === "power"
                  ? "Interconnection suitability"
                  : axis === "risk"
                  ? "Hazard safety (higher = safer)"
                  : "Balanced power × risk"}{" "}
                — top/middle/bottom third of the current view
              </div>
              {[
                { c: AXIS_COLOR_TOP, l: "Top third", r: `> ${axisTerciles[1]}` },
                {
                  c: AXIS_COLOR_MID,
                  l: "Middle third",
                  // Scores can cluster tightly; collapse the range to a single
                  // value when the band is one point wide rather than "52–52".
                  r:
                    axisTerciles[1] > axisTerciles[0] + 1
                      ? `${axisTerciles[0] + 1}–${axisTerciles[1]}`
                      : `${axisTerciles[1]}`,
                },
                { c: AXIS_COLOR_LOW, l: "Bottom third", r: `≤ ${axisTerciles[0]}` },
                {
                  c: AXIS_COLOR_NONE,
                  l: axis === "risk" ? "No risk data" : "Not scored",
                  r: "—",
                },
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
            {hasFullAccess && plan.canSeeRisk ? (
              <>
                Diligence view — Power, Risk, Combined, compare, and
                print/CSV. Model reliability varies by region; each panel
                shows the caveat. For internal screening, not a utility study.
              </>
            ) : hasFullAccess ? (
              <>
                Screening seat — national catalog ranked by Power. Risk,
                Combined, compare, print, and CSV sit on the Diligence
                license.
              </>
            ) : (
              <>
                Sample — six sites, Power only. Screening ($3,000/mo) unlocks
                the catalog for a live hunt; Diligence ($30,000/yr) is the
                write-down.
              </>
            )}
          </p>
        </div>

        {plan.canCompare && compareNames.length > 0 && (
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
                total={totalCount}
                canSeeRisk={plan.canSeeRisk}
                canExport={plan.canExport}
                onExportCsv={exportCsv}
              />
            </div>

            <SubstationList
              items={visibleRows}
              hiddenCount={sorted.length - visibleRows.length}
              axisTerciles={allAxisTerciles}
              selectedName={selectedName}
              compareSet={compareSet}
              compareFull={compareNames.length >= 4}
              onSelect={select}
              onToggleCompare={toggleCompare}
              canCompare={plan.canCompare}
              showRisk={plan.canSeeRisk}
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
                  axisTerciles={allAxisTerciles}
                  collapsed={detailCollapsed}
                  onToggleCollapsed={() => setDetailCollapsed((c) => !c)}
                  onExport={exportPrint}
                  canSeeRisk={plan.canSeeRisk}
                  canExport={plan.canExport}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="no-print border-b border-white/5 px-5 py-2.5">
              <p className="font-tele text-[11px] uppercase tracking-[0.14em] text-[var(--accent-bright)]">
                Preview · Power · six sites
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                Sample of the instrument. Screening is a live hunt on the full
                catalog; Diligence adds Risk, Combined, compare, print, and
                CSV.
              </p>
              <label className="mt-2.5 flex min-w-0 items-center gap-2 text-[11px] text-neutral-500">
                <span className="shrink-0">Sort by</span>
                <select
                  value={sortKey}
                  onChange={(e) => {
                    const next = e.target.value as SortKey;
                    setSortKey(next);
                    if (next === "power") setAxis("power");
                  }}
                  className="w-full cursor-pointer rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-neutral-200 outline-none transition-colors hover:border-white/20 focus:border-blue-500/60"
                >
                  {SORT_OPTIONS.filter(
                    (o) => o.key !== "risk" && o.key !== "combined"
                  ).map((o) => (
                    <option key={o.key} value={o.key} className="bg-neutral-900">
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <SubstationList
              items={teaserSorted}
              hiddenCount={0}
              axisTerciles={allAxisTerciles}
              selectedName={selectedName}
              compareSet={compareSet}
              compareFull={compareNames.length >= 4}
              onSelect={select}
              onToggleCompare={toggleCompare}
              canCompare={false}
              showRisk={false}
            />

            {teaserSelected && !compareOpen && (
              <div
                className={`shrink-0 overflow-y-auto ${
                  detailCollapsed ? "" : "max-h-[46%]"
                }`}
              >
                <DetailPanel
                  s={teaserSelected}
                  terciles={terciles}
                  axisTerciles={allAxisTerciles}
                  collapsed={detailCollapsed}
                  onToggleCollapsed={() => setDetailCollapsed((c) => !c)}
                  onExport={exportPrint}
                  canSeeRisk={false}
                  canExport={false}
                />
              </div>
            )}

            <TeaserContact
              previewCount={teaserSubstations.length}
              total={totalCount}
            />
          </>
        )}
      </div>
      </div>

      {plan.canCompare && compareOpen && compareItems.length >= 2 && (
        <CompareView
          items={compareItems}
          terciles={terciles}
          axisTerciles={allAxisTerciles}
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
    </ExplorerScoreProvider>
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
