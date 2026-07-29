"use client";

// Side-by-side comparison of up to 4 substations, as a full-screen overlay.
// Styled to match the homepage's instrument-grade language: engineering-grid
// backdrop, radial accent glow, mono telemetry readouts, and orchestrated
// framer-motion reveals. Each substation is a column led by its GridSolve Site
// Score; every comparable metric renders as a "goodness"-normalized bar so the
// stronger site always reads as the fuller, brighter bar and the winner glows.
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  scoreBandLabel,
  scoreColor,
  type ScoredSubstation,
} from "@/lib/siteScore";
import { tierMeta } from "@/lib/data";
import { useCanAnimate } from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import { PrintFooter, PrintHeader } from "./PrintChrome";

const EASE = [0.16, 1, 0.3, 1] as const; // ease-out-expo, same as the homepage
const mw = (n: number) => `${Math.round(n).toLocaleString()} MW`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

// "better" tells the bar which direction is good, so bars always fill toward
// the stronger value regardless of whether the raw metric is high- or
// low-is-better. "context" bars carry magnitude only (no winner).
type Better = "high" | "low" | "context";

type Metric = {
  key: string;
  label: string;
  unit: string;
  better: Better;
  raw: (s: ScoredSubstation) => number | null;
  fmt: (s: ScoredSubstation) => string;
};

const METRICS: Metric[] = [
  {
    key: "adjusted",
    label: "Deliverable capacity",
    unit: "likely-real MW",
    better: "high",
    raw: (s) => (s.hasActiveQueue ? s.adjustedMw : null),
    fmt: (s) => (s.hasActiveQueue ? mw(s.adjustedMw) : "—"),
  },
  {
    key: "queued",
    label: "Queued capacity",
    unit: "MW in queue",
    better: "context",
    raw: (s) => (s.hasActiveQueue ? s.queuedMw : null),
    fmt: (s) => (s.hasActiveQueue ? mw(s.queuedMw) : "—"),
  },
  {
    key: "cost",
    label: "Cost to connect",
    unit: "$/kW median",
    better: "low",
    raw: (s) => s.medianNetworkCostPerKw,
    fmt: (s) =>
      s.medianNetworkCostPerKw != null
        ? `$${Math.round(s.medianNetworkCostPerKw).toLocaleString()}`
        : "no data",
  },
  {
    key: "withdrawal",
    label: "Historical withdrawal",
    unit: "% of projects lost",
    better: "low",
    raw: (s) => s.histWithdrawRate,
    fmt: (s) => (s.histWithdrawRate != null ? pct(s.histWithdrawRate) : "n/a"),
  },
  {
    key: "projects",
    label: "Track record",
    unit: "projects attempted",
    better: "context",
    raw: (s) => (s.histProjects > 0 ? s.histProjects : null),
    fmt: (s) => String(s.histProjects),
  },
];

// Per-metric bar widths (0-1, higher = better) and the winning column, from a
// min-max normalization over whatever values are present. A small floor keeps
// the weakest present value showing a visible nub rather than nothing.
function computeMetric(items: ScoredSubstation[], m: Metric) {
  const raws = items.map(m.raw);
  const present = raws.filter((v): v is number => v != null);
  const min = present.length ? Math.min(...present) : 0;
  const max = present.length ? Math.max(...present) : 0;
  const span = max - min;

  const goodness = raws.map((v) => {
    if (v == null) return null;
    if (span === 0) return 1;
    return m.better === "low" ? (max - v) / span : (v - min) / span;
  });
  const width = goodness.map((g) => (g == null ? null : Math.max(0.08, g)));

  let winnerVal: number | null = null;
  if (present.length > 1 && m.better !== "context") {
    winnerVal = m.better === "low" ? min : max;
  }
  const isWinner = raws.map((v) => winnerVal != null && v === winnerVal);

  return { width, isWinner };
}

export default function CompareView({
  items,
  terciles,
  onRemove,
  onClear,
  onClose,
  onExport,
}: {
  items: ScoredSubstation[];
  terciles: [number, number];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  onExport: () => void;
}) {
  const canAnimate = useCanAnimate();

  // Escape closes the overlay — expected for a full-screen modal surface.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const n = items.length;
  const scores = items
    .map((s) => s.scoreResult?.score)
    .filter((v): v is number => v != null);
  const bestScore = scores.length ? Math.max(...scores) : null;
  const isLeader = items.map(
    (s) => bestScore != null && s.scoreResult?.score === bestScore
  );
  const metrics = METRICS.map((m) => ({ m, ...computeMetric(items, m) }));

  const gridStyle = {
    gridTemplateColumns: `minmax(120px, 150px) repeat(${n}, minmax(180px, 1fr))`,
  };

  return (
    <motion.div
      initial={canAnimate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#07080a] text-neutral-200"
      role="dialog"
      aria-modal="true"
      aria-label="Compare substations"
    >
      {/* Homepage-grade backdrop: faint engineering grid + a radial accent
          glow bleeding down from the top edge. */}
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(65%_55%_at_50%_0%,rgba(61,123,255,0.12),transparent_65%)]" />

      {/* Header */}
      <div className="no-print relative z-10 flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <PulseMark canAnimate={canAnimate} />
          <div className="min-w-0">
            <h2 className="whitespace-nowrap font-display text-[17px] font-semibold tracking-tight text-white">
              Site comparison
            </h2>
            <p className="truncate font-tele text-[11px] text-neutral-500">
              {n} {n === 1 ? "site" : "sites"} · GridSolve Site Score, relative
              within the current view
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <GhostButton onClick={onExport}>Export</GhostButton>
          <GhostButton onClick={onClear}>Clear</GhostButton>
          <GhostButton onClick={onClose} variant="accent">
            Close
          </GhostButton>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="no-print relative z-10 flex-1 overflow-auto px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-x-auto pb-6">
          <div className="grid gap-x-3" style={gridStyle}>
            {/* Row: substation headers */}
            <div />
            {items.map((s, i) => (
              <Cell key={s.id} canAnimate={canAnimate} delay={0.04 * i}>
                <div
                  className="relative rounded-lg border px-3 py-2.5"
                  style={{
                    borderColor: isLeader[i]
                      ? "rgba(91,147,255,0.35)"
                      : "rgba(255,255,255,0.08)",
                    background: isLeader[i]
                      ? "rgba(61,123,255,0.06)"
                      : "transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-semibold text-white">
                        {s.name}
                      </div>
                      <div className="font-tele text-[11px] text-neutral-500">
                        {s.county}, {s.state} · {s.region}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(s.id)}
                      aria-label={`Remove ${s.name}`}
                      className="shrink-0 rounded p-0.5 text-neutral-600 transition-colors hover:text-neutral-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                  {isLeader[i] && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 font-tele text-[9px] uppercase tracking-[0.14em] text-[var(--accent-bright)]">
                      <span className="h-1 w-1 rounded-full bg-[var(--accent-bright)]" />
                      Top score
                    </div>
                  )}
                </div>
              </Cell>
            ))}

            {/* Row: hero Site Score */}
            <RowLabel label="Site Score" unit="0–100, higher better" />
            {items.map((s, i) => {
              const score = s.scoreResult?.score ?? null;
              const color = s.hasActiveQueue
                ? scoreColor(score, terciles)
                : "#6b7280";
              return (
                <Cell
                  key={s.id}
                  canAnimate={canAnimate}
                  delay={0.12 + 0.05 * i}
                  className="px-3 py-3"
                >
                  {score != null ? (
                    <>
                      <div
                        className="font-tele text-[2.5rem] font-semibold leading-none"
                        style={{
                          color,
                          textShadow: isLeader[i]
                            ? `0 0 22px ${color}66`
                            : "none",
                        }}
                      >
                        <CountUp value={score} />
                      </div>
                      <div
                        className="mt-1.5 font-tele text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color }}
                      >
                        {scoreBandLabel(score, terciles)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-tele text-[2.5rem] font-semibold leading-none text-neutral-700">
                        —
                      </div>
                      <div className="mt-1.5 font-tele text-[10px] uppercase tracking-[0.14em] text-neutral-600">
                        No active queue
                      </div>
                    </>
                  )}
                </Cell>
              );
            })}

            {/* Divider */}
            <div
              className="mb-1 mt-4 border-t border-white/[0.06]"
              style={{ gridColumn: "1 / -1" }}
            />

            {/* Metric rows */}
            {metrics.map(({ m, width, isWinner }, rowIdx) => (
              <MetricRow
                key={m.key}
                metric={m}
                items={items}
                width={width}
                isWinner={isWinner}
                canAnimate={canAnimate}
                rowIdx={rowIdx}
              />
            ))}

            {/* Row: model reliability (region + tier — the score's caveat) */}
            <RowLabel label="Model reliability" unit="survival-model validation" />
            {items.map((s, i) => {
              const tier = tierMeta(s.modelTier);
              return (
                <Cell
                  key={s.id}
                  canAnimate={canAnimate}
                  delay={0.24 + METRICS.length * 0.07 + 0.03 * i}
                  className="px-3 py-2.5"
                >
                  <span
                    className="inline-block rounded px-2 py-0.5 font-tele text-[10px] font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: tier.color + "22", color: tier.color }}
                  >
                    {tier.label}
                  </span>
                  <div className="mt-1 font-tele text-[10px] text-neutral-500">
                    {s.regionConcordance != null
                      ? `${s.region} · ${s.regionConcordance.toFixed(2)}`
                      : `${s.region} · n/a`}
                  </div>
                </Cell>
              );
            })}
          </div>
        </div>
      </div>

      {/* Printable version — hidden on screen, shown only in @media print
          (see globals.css). Kept as a clean white-paper table. */}
      <div className="print-report bg-white p-8 text-black">
        <PrintHeader />
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-black/20 py-2 text-left">&nbsp;</th>
              {items.map((s) => (
                <th key={s.id} className="border-b border-black/20 px-3 py-2 text-left">
                  {s.name}
                  <div className="text-xs font-normal text-black/60">
                    {s.county}, {s.state} · {s.region}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <PrintRow
              label="GridSolve Site Score"
              cells={items.map((s) =>
                s.scoreResult != null ? String(s.scoreResult.score) : "no active queue"
              )}
            />
            <PrintRow label="Queued MW" cells={items.map((s) => mw(s.queuedMw))} />
            <PrintRow
              label="Adjusted available MW"
              cells={items.map((s) => mw(s.adjustedMw))}
            />
            <PrintRow
              label="Median cost / kW"
              cells={items.map((s) =>
                s.medianNetworkCostPerKw != null
                  ? `$${Math.round(s.medianNetworkCostPerKw).toLocaleString()}`
                  : "no cost data"
              )}
            />
            <PrintRow
              label="Historical withdrawal rate"
              cells={items.map((s) =>
                s.histWithdrawRate != null ? pct(s.histWithdrawRate) : "n/a"
              )}
            />
            <PrintRow
              label="Projects attempted"
              cells={items.map((s) => String(s.histProjects))}
            />
            <PrintRow
              label="Model reliability"
              cells={items.map((s) => {
                const t = tierMeta(s.modelTier);
                return s.regionConcordance != null
                  ? `${t.label} (${s.region} ${s.regionConcordance.toFixed(2)})`
                  : `${t.label} (${s.region})`;
              })}
            />
          </tbody>
        </table>
        <PrintFooter />
      </div>
    </motion.div>
  );
}

// One metric: a label cell plus a goodness-bar + value per substation.
function MetricRow({
  metric,
  items,
  width,
  isWinner,
  canAnimate,
  rowIdx,
}: {
  metric: Metric;
  items: ScoredSubstation[];
  width: (number | null)[];
  isWinner: boolean[];
  canAnimate: boolean;
  rowIdx: number;
}) {
  return (
    <>
      <RowLabel label={metric.label} unit={metric.unit} />
      {items.map((s, i) => {
        const w = width[i];
        const win = isWinner[i];
        const barColor = win ? "var(--accent-bright)" : "rgba(61,123,255,0.4)";
        const delay = 0.24 + rowIdx * 0.07 + 0.03 * i;
        return (
          <Cell key={s.id} canAnimate={canAnimate} delay={delay} className="px-3 py-2.5">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span
                className="font-tele text-sm"
                style={{ color: win ? "var(--accent-bright)" : "#d4d4d4" }}
              >
                {metric.fmt(s)}
              </span>
              {win && (
                <span className="font-tele text-[9px] uppercase tracking-[0.12em] text-[var(--accent-bright)]">
                  best
                </span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              {w != null && (
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: barColor,
                    boxShadow: win ? "0 0 10px 0 rgba(91,147,255,0.6)" : "none",
                  }}
                  initial={canAnimate ? { width: 0 } : false}
                  animate={{ width: `${w * 100}%` }}
                  transition={{ duration: 0.9, ease: EASE, delay: delay + 0.08 }}
                />
              )}
            </div>
          </Cell>
        );
      })}
    </>
  );
}

// Left-column label for a row (metric name + unit), in the telemetry voice.
function RowLabel({ label, unit }: { label: string; unit: string }) {
  return (
    <div className="flex flex-col justify-center py-2.5 pr-3">
      <span className="text-xs font-medium text-neutral-300">{label}</span>
      {unit && (
        <span className="font-tele text-[10px] text-neutral-600">{unit}</span>
      )}
    </div>
  );
}

// Motion wrapper for a single animated grid cell.
function Cell({
  children,
  canAnimate,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  canAnimate: boolean;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={canAnimate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// The pulsing accent square from the homepage logo mark, reused as a live
// telemetry cue in the header.
function PulseMark({ canAnimate }: { canAnimate: boolean }) {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <span className="absolute inset-0 rounded-[7px] border border-[var(--accent)]/40" />
      <motion.span
        className="h-2 w-2 rounded-[2px] bg-[var(--accent-bright)]"
        style={{ boxShadow: "0 0 10px 0 var(--accent)" }}
        animate={canAnimate ? { opacity: [0.4, 1, 0.4] } : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

function GhostButton({
  children,
  onClick,
  variant = "ghost",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "ghost" | "accent";
}) {
  const base =
    "rounded-md px-3 py-1.5 text-xs transition-colors border";
  const styles =
    variant === "accent"
      ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-bright)] hover:border-[var(--accent)]/70 hover:bg-[var(--accent)]/20"
      : "border-white/10 text-neutral-300 hover:border-white/25 hover:text-white";
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function PrintRow({ label, cells }: { label: string; cells: string[] }) {
  return (
    <tr>
      <td className="border-b border-black/10 py-2 pr-3 text-black/60">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className="border-b border-black/10 px-3 py-2">
          {c}
        </td>
      ))}
    </tr>
  );
}
