"use client";

// The preview list shown to signed-in users without full explorer access: a
// small, hand-varied set of substations (2 strong / 2 middling / 2 weak,
// coast to coast) with their real two-axis scores (Power/Risk/Combined —
// same badges as the full SubstationList) and the same compare checkboxes, so
// a preview user can compare among the curated 6 even before unlocking the
// full explorer. Selecting a row opens its full detail panel (rendered by the
// explorer page), and the contact prompt (TeaserContact) sits below.
import { type ScoredSubstation } from "@/lib/siteScore";
import { axisColor, AXIS_COLOR_NONE, type Axis } from "@/lib/scores";
import { useExplorerScore } from "./ExplorerScoreContext";
import { AxisBadges } from "./AxisBadges";

const mw = (n: number) => `${Math.round(n).toLocaleString()} MW`;

export default function ExplorerTeaser({
  items,
  axisTerciles,
  selectedName,
  compareSet,
  compareFull,
  onSelect,
  onToggleCompare,
}: {
  items: ScoredSubstation[];
  axisTerciles: Record<Axis, [number, number]>;
  selectedName: string | null;
  compareSet: Set<string>;
  compareFull: boolean;
  onSelect: (s: ScoredSubstation) => void;
  onToggleCompare: (id: string) => void;
}) {
  const scoreOf = useExplorerScore();

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0a0b]/90 px-5 py-2.5 backdrop-blur">
        <p className="font-tele text-[11px] uppercase tracking-[0.14em] text-[var(--accent-bright)]">
          Preview · a varied sample, coast to coast
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Select any site to see its full breakdown, or check up to 4 to
          compare — power, risk, and combined.
        </p>
      </div>

      {items.map((s) => {
        const active = s.id === selectedName;
        // The row dot reflects the COMBINED axis, same convention as the full
        // SubstationList — gray/hollow when there's no combined score.
        const combined = scoreOf(s).combined;
        const color =
          combined != null ? axisColor(combined, axisTerciles.combined) : AXIS_COLOR_NONE;
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

            <button
              onClick={() => onSelect(s)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
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
                      {mw(s.queuedMw)} queued{" "}
                      <span className="text-neutral-600">→</span>{" "}
                      <span className="text-neutral-300">
                        {mw(s.adjustedMw)} likely real
                      </span>
                      {s.medianNetworkCostPerKw != null && (
                        <> · ${Math.round(s.medianNetworkCostPerKw)}/kW</>
                      )}
                    </>
                  ) : (
                    <>no active queue — cost/history only</>
                  )}
                </div>
              </div>
              <AxisBadges s={s} axisTerciles={axisTerciles} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
