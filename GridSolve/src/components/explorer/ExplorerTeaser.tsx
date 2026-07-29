"use client";

// The preview list shown to signed-in users without full explorer access: a
// small, hand-varied set of substations (2 strong / 2 middling / 2 weak,
// coast to coast) with their real GridSolve Site Scores. Selecting one opens its
// full detail panel (rendered by the explorer page), and the contact prompt
// (TeaserContact) sits below. Rows mirror the full SubstationList styling.
import { scoreColor, type ScoredSubstation } from "@/lib/siteScore";

const mw = (n: number) => `${Math.round(n).toLocaleString()} MW`;

export default function ExplorerTeaser({
  items,
  terciles,
  selectedName,
  onSelect,
}: {
  items: ScoredSubstation[];
  terciles: [number, number];
  selectedName: string | null;
  onSelect: (s: ScoredSubstation) => void;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0a0b]/90 px-5 py-2.5 backdrop-blur">
        <p className="font-tele text-[11px] uppercase tracking-[0.14em] text-[var(--accent-bright)]">
          Preview · a varied sample, coast to coast
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
          Select any site to see its full breakdown — score, queue, phantom, and
          more.
        </p>
      </div>

      {items.map((s) => {
        const active = s.id === selectedName;
        const score = s.scoreResult?.score ?? null;
        const color = s.hasActiveQueue
          ? scoreColor(score, terciles)
          : "#6b7280";

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`flex w-full items-center gap-3 border-b border-white/5 px-5 py-3 text-left transition-colors hover:bg-white/[0.03] ${
              active ? "bg-white/[0.05]" : ""
            }`}
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
            <span
              className="shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-semibold"
              style={{ backgroundColor: color + "22", color }}
              title="GridSolve Site Score"
            >
              {score != null ? score : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
