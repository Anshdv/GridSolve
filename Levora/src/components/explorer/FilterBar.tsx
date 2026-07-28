"use client";

// Filter + sort controls for the explorer's substation list. Pure controlled
// component — all state lives in the parent (explorer/page.tsx) so the map,
// list, and count all derive from the same filtered set.
//
// The dataset is national (9 regions, ~48 states), so region is the primary
// geographic filter (a short chip row) and state is a lookup dropdown.
import type { CostBandKey } from "@/lib/data";

export type StatusFilter = "active" | "history" | "all";
export type SortKey = "score" | "adjusted" | "cost" | "withdrawal" | "name";

export type Filters = {
  regions: string[]; // empty = all regions
  state: string; // "" = all states
  status: StatusFilter;
  costBand: CostBandKey;
  exactOnly: boolean; // only substations with verified (not approximate) coords
  search: string;
};

const COST_OPTIONS: { key: CostBandKey; label: string }[] = [
  { key: "any", label: "Any cost" },
  { key: "low", label: "< $150/kW" },
  { key: "mid", label: "$150–600/kW" },
  { key: "high", label: "> $600/kW" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Levora Site Score (high → low)" },
  { key: "adjusted", label: "Adjusted available MW (high → low)" },
  { key: "cost", label: "Median cost (low → high)" },
  { key: "withdrawal", label: "Historical withdrawal rate (low → high)" },
  { key: "name", label: "Name (A → Z)" },
];

const selectClass =
  "cursor-pointer rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-neutral-200 outline-none transition-colors hover:border-white/20 focus:border-blue-500/60";

export default function FilterBar({
  availableRegions,
  availableStates,
  filters,
  onFiltersChange,
  sortKey,
  onSortChange,
  shown,
  total,
}: {
  availableRegions: string[];
  availableStates: string[];
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  shown: number;
  total: number;
}) {
  function toggleRegion(r: string) {
    const has = filters.regions.includes(r);
    onFiltersChange({
      ...filters,
      regions: has
        ? filters.regions.filter((x) => x !== r)
        : [...filters.regions, r],
    });
  }

  return (
    <div className="space-y-3 border-b border-white/5 px-5 py-4">
      {/* Search */}
      <input
        type="text"
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        placeholder="Search by name or county…"
        className="w-full rounded border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-neutral-200 outline-none transition-colors placeholder:text-neutral-600 hover:border-white/20 focus:border-blue-500/60"
      />

      {/* Region multi-select chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] text-neutral-500">Region</span>
        {availableRegions.map((r) => {
          const active = filters.regions.includes(r);
          return (
            <button
              key={r}
              onClick={() => toggleRegion(r)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
              }`}
            >
              {r}
            </button>
          );
        })}
        {filters.regions.length > 0 && (
          <button
            onClick={() => onFiltersChange({ ...filters, regions: [] })}
            className="text-[11px] text-neutral-500 underline decoration-dotted hover:text-neutral-300"
          >
            clear
          </button>
        )}
      </div>

      {/* State + status + cost band + mapped-only */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.state}
          onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
          className={selectClass}
          aria-label="State"
        >
          <option value="" className="bg-neutral-900">
            All states
          </option>
          {availableStates.map((st) => (
            <option key={st} value={st} className="bg-neutral-900">
              {st}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              status: e.target.value as StatusFilter,
            })
          }
          className={selectClass}
          aria-label="Status"
        >
          <option value="all" className="bg-neutral-900">
            All statuses
          </option>
          <option value="active" className="bg-neutral-900">
            Active queue only
          </option>
          <option value="history" className="bg-neutral-900">
            History only (no active queue)
          </option>
        </select>

        <select
          value={filters.costBand}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              costBand: e.target.value as CostBandKey,
            })
          }
          className={selectClass}
          aria-label="Cost band"
        >
          {COST_OPTIONS.map((o) => (
            <option key={o.key} value={o.key} className="bg-neutral-900">
              {o.label}
            </option>
          ))}
        </select>

        <label
          className="flex cursor-pointer items-center gap-1.5 text-[11px] text-neutral-400"
          title="Show only substations with verified coordinates (hide approximate placements)"
        >
          <input
            type="checkbox"
            checked={filters.exactOnly}
            onChange={(e) =>
              onFiltersChange({ ...filters, exactOnly: e.target.checked })
            }
            className="h-3 w-3 cursor-pointer accent-blue-500"
          />
          Exact coords only
        </label>
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[11px] text-neutral-500">
          <span className="shrink-0">Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className={`w-full ${selectClass}`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key} className="bg-neutral-900">
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <span className="shrink-0 whitespace-nowrap text-[11px] text-neutral-600">
          {shown.toLocaleString()} of {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
