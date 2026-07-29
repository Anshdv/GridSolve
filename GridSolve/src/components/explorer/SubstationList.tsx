"use client";

// Scrollable list of filtered/sorted substations. Each row leads with the
// GridSolve Site Score badge (colored by tercile — see siteScore.ts), then the
// two real numbers (queued → adjusted MW) and the cost. A no-active-queue
// station has no score to show and says so plainly instead of a blank or 0.
import { scoreColor, type ScoredSubstation } from "@/lib/siteScore";

const mw = (n: number) => `${Math.round(n).toLocaleString()} MW`;

export default function SubstationList({
  items,
  hiddenCount,
  terciles,
  selectedName,
  compareSet,
  compareFull,
  onSelect,
  onToggleCompare,
}: {
  items: ScoredSubstation[];
  hiddenCount: number; // matched rows not rendered (list is capped)
  terciles: [number, number];
  selectedName: string | null;
  compareSet: Set<string>;
  compareFull: boolean;
  onSelect: (s: ScoredSubstation) => void;
  onToggleCompare: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex-1 px-5 py-8 text-center text-xs text-neutral-600">
        No substations match these filters.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {items.map((s) => {
        const active = s.id === selectedName;
        const score = s.scoreResult?.score ?? null;
        const color = s.hasActiveQueue ? scoreColor(score, terciles) : "#6b7280";
        const checked = compareSet.has(s.id);
        const disableCheck = !checked && compareFull;

        return (
          <div
            key={s.id}
            className={`flex w-full items-center gap-3 border-b border-white/5 px-5 py-3 transition-colors hover:bg-white/[0.03] ${
              active ? "bg-white/[0.05]" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disableCheck}
              onChange={() => onToggleCompare(s.id)}
              title={
                disableCheck
                  ? "Up to 4 substations can be compared at once"
                  : "Add to comparison"
              }
              className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
            />

            <button onClick={() => onSelect(s)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              {/* Status/score indicator: filled = active queue (scored), hollow = no active queue */}
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={
                  s.hasActiveQueue
                    ? { backgroundColor: color }
                    : {
                        backgroundColor: "transparent",
                        border: `1.5px solid ${color}`,
                      }
                }
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">
                  {s.name}
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {s.county}, {s.state}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  <span className="font-mono text-neutral-600">{s.region}</span>
                  {" · "}
                  {s.hasActiveQueue ? (
                    <>
                      {mw(s.queuedMw)} queued <span className="text-neutral-600">→</span>{" "}
                      <span className="text-neutral-300">{mw(s.adjustedMw)} likely real</span>
                      {s.medianNetworkCostPerKw != null && (
                        <> · ${Math.round(s.medianNetworkCostPerKw)}/kW</>
                      )}
                    </>
                  ) : (
                    <>
                      no active queue — cost/history only
                      {s.histProjects > 0 && (
                        <> · {s.histProjects} historical {s.histProjects === 1 ? "project" : "projects"}</>
                      )}
                    </>
                  )}
                </div>
              </div>
              <span
                className="shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-semibold"
                style={{ backgroundColor: color + "22", color }}
                title="GridSolve Site Score"
              >
                {score != null ? score : "—"}
              </span>
            </button>
          </div>
        );
      })}

      {hiddenCount > 0 && (
        <div className="px-5 py-4 text-center text-[11px] leading-relaxed text-neutral-600">
          + {hiddenCount.toLocaleString()} more match your filters. Narrow by
          region, state, or search to see them.
        </div>
      )}
    </div>
  );
}
