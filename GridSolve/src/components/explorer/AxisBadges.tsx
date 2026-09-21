"use client";

// The three two-axis score badges — Power, Risk, Combined — shown together on
// every list row and in the compare table. Each badge is colored by its OWN
// axis's tercile banding (passed in), and each handles its null case with a
// plain "—" plus a tooltip rather than a blank or a NaN. Risk with no hazard
// data reads "no risk data" on hover.
import type { Substation } from "@/lib/data-meta";
import {
  axisValue,
  axisColor,
  AXIS_LABEL,
  AXIS_COLOR_NONE,
  type Axis,
} from "@/lib/scores";
import { useExplorerScore } from "./ExplorerScoreContext";

const AXES: Axis[] = ["power", "risk", "combined"];

export function AxisBadges({
  s,
  axisTerciles,
  size = "sm",
  showRisk = true,
}: {
  s: Substation;
  axisTerciles: Record<Axis, [number, number]>;
  size?: "sm" | "md";
  showRisk?: boolean;
}) {
  const scoreOf = useExplorerScore();
  const two = scoreOf(s);
  const pad = size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[10px]";
  const axes = showRisk ? AXES : (["power"] as Axis[]);
  return (
    <div className="flex shrink-0 items-center gap-1">
      {axes.map((a) => {
        const v = axisValue(two, a);
        const color = v == null ? AXIS_COLOR_NONE : axisColor(v, axisTerciles[a]);
        const title =
          v == null
            ? a === "risk"
              ? `${AXIS_LABEL[a]}: no risk data`
              : `${AXIS_LABEL[a]}: not scored`
            : `${AXIS_LABEL[a]} score ${v}`;
        return (
          <span
            key={a}
            title={title}
            className={`inline-flex items-center gap-1 rounded font-mono font-semibold ${pad}`}
            style={{ backgroundColor: color + "22", color }}
          >
            <span className="opacity-70">{AXIS_LABEL[a][0]}</span>
            {v != null ? v : "—"}
          </span>
        );
      })}
    </div>
  );
}
