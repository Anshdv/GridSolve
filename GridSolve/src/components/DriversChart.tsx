// Horizontal bars of Cox-model hazard ratios. Drawn in CSS so the values are
// present in the HTML on first paint — Recharts' ResponsiveContainer often
// measures 0×0 on SSR/hydration and ships an empty plot.
import type { Driver } from "@/lib/data";

export default function DriversChart({ drivers }: { drivers: Driver[] }) {
  const rows = [...drivers].sort((a, b) => b.hazard_ratio - a.hazard_ratio);
  const max = Math.max(...rows.map((d) => d.hazard_ratio), 1);
  const domain = Math.max(max * 1.15, 1);
  const baselinePct = (1 / domain) * 100;

  if (rows.length === 0) {
    return (
      <p className="mt-6 text-sm text-neutral-500">
        Hazard-ratio coefficients are not in this dataset snapshot.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <ul className="space-y-4">
        {rows.map((d) => {
          const widthPct = (d.hazard_ratio / domain) * 100;
          return (
            <li key={d.feature}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-[13px] leading-snug text-neutral-200">
                  {d.feature}
                </span>
                <span className="font-tele shrink-0 text-[12.5px] tabular-nums tracking-normal text-neutral-100">
                  {d.hazard_ratio.toFixed(2)}×
                </span>
              </div>
              <div className="relative h-2.5 rounded-full bg-white/[0.06]">
                <div
                  className="pointer-events-none absolute inset-y-[-3px] w-px bg-neutral-500"
                  style={{ left: `${baselinePct}%` }}
                  aria-hidden
                />
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-neutral-500">
        Vertical mark is 1.0 — no effect.
      </p>
    </div>
  );
}
