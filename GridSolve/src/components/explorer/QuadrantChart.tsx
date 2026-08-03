"use client";

// COMBINED VIEW — a small 2×2 quadrant chart plotting substations on Power
// (x-axis) against Risk (y-axis). Top-right = strong on BOTH axes; that's the
// headline read the two-axis system exists to surface: the tradeoff, not a
// single verdict. Points with a null on either axis can't be placed, so they're
// listed below the chart as "not plottable" rather than dropped silently or
// jammed onto an edge at a fake 0.
import type { Substation } from "@/lib/data-meta";
import type { TwoAxisScore } from "@/lib/scores";
import { useExplorerScore } from "./ExplorerScoreContext";

// Pure SVG, no chart dependency. viewBox is square; the parent controls size.
const SIZE = 200;
const PAD = 22; // room for axis labels

export default function QuadrantChart({
  items,
  highlightId,
}: {
  items: Substation[];
  highlightId?: string | null;
}) {
  const scoreOf = useExplorerScore();
  const plotted = items
    .map((s) => ({ s, two: scoreOf(s) }))
    .filter(
      (x): x is { s: Substation; two: TwoAxisScore } =>
        x.two.powerScore != null && x.two.riskScore != null
    );
  const notPlottable = items.filter((s) => {
    const t = scoreOf(s);
    return t.powerScore == null || t.riskScore == null;
  });

  // Map a 0–100 score to an SVG coordinate. Power → x (right = higher),
  // Risk → y (top = higher/safer, so invert the SVG y).
  const x = (p: number) => PAD + (p / 100) * (SIZE - 2 * PAD);
  const y = (r: number) => SIZE - PAD - (r / 100) * (SIZE - 2 * PAD);
  const mid = 50;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full min-w-[220px] max-w-[280px]"
          role="img"
          aria-label="Power versus risk quadrant chart"
        >
          {/* Quadrant fills — top-right (strong on both) tinted green. */}
          <rect
            x={x(mid)}
            y={PAD}
            width={x(100) - x(mid)}
            height={y(mid) - PAD}
            fill="#22c55e"
            opacity={0.06}
          />
          {/* Grid frame + midlines */}
          <rect
            x={PAD}
            y={PAD}
            width={SIZE - 2 * PAD}
            height={SIZE - 2 * PAD}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
          />
          <line
            x1={x(mid)}
            y1={PAD}
            x2={x(mid)}
            y2={SIZE - PAD}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />
          <line
            x1={PAD}
            y1={y(mid)}
            x2={SIZE - PAD}
            y2={y(mid)}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />

          {/* Axis labels */}
          <text x={SIZE / 2} y={SIZE - 4} textAnchor="middle" fontSize="8" fill="#a3a3a3">
            Power →
          </text>
          <text
            x={10}
            y={SIZE / 2}
            textAnchor="middle"
            fontSize="8"
            fill="#a3a3a3"
            transform={`rotate(-90 10 ${SIZE / 2})`}
          >
            Safer (Risk) →
          </text>
          <text x={x(100)} y={PAD - 6} textAnchor="end" fontSize="7" fill="#22c55e">
            strong on both
          </text>

          {/* Points */}
          {plotted.map(({ s, two }) => {
            const isHi = s.id === highlightId;
            return (
              <circle
                key={s.id}
                cx={x(two.powerScore as number)}
                cy={y(two.riskScore as number)}
                r={isHi ? 4.5 : 3}
                fill={isHi ? "#ffffff" : "#60a5fa"}
                stroke={isHi ? "#60a5fa" : "rgba(0,0,0,0.4)"}
                strokeWidth={isHi ? 1.5 : 0.75}
                opacity={isHi ? 1 : 0.85}
              >
                <title>{`${s.name} — Power ${two.powerScore}, Risk ${two.riskScore}`}</title>
              </circle>
            );
          })}
        </svg>
      </div>

      {plotted.length === 0 && (
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
          Nothing to plot yet — the quadrant needs both a Power and a Risk score,
          and no risk (FEMA hazard) data is present for these sites.
        </p>
      )}
      {notPlottable.length > 0 && plotted.length > 0 && (
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-600">
          {notPlottable.length} not plottable (missing a Power or Risk score).
        </p>
      )}
    </div>
  );
}
