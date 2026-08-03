"use client";

// The substation detail panel — a GridSolve Site Score section up top, then the
// original four sections, each a plain-English fact plus the number(s)
// behind it. Every value handles its null case explicitly (no active queue /
// no cost data / unmapped) rather than rendering NaN or a blank.
import {
  confidenceReason,
  scoreBandLabel,
  scoreColor,
  type ScoredSubstation,
} from "@/lib/siteScore";
import { tierMeta } from "@/lib/data-meta";
import {
  hazardReadings,
  dominantHazardsCaption,
  axisColor,
  bandLabel,
  AXIS_COLOR_LOW,
  type Axis,
} from "@/lib/scores";
import { useExplorerScore } from "./ExplorerScoreContext";
import { AxisBadges } from "./AxisBadges";
import QuadrantChart from "./QuadrantChart";
import { PrintFooter, PrintHeader } from "./PrintChrome";

const mw = (n: number) => `${Math.round(n).toLocaleString()} MW`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function DetailPanel({
  s,
  terciles,
  axisTerciles,
  collapsed,
  onToggleCollapsed,
  onExport,
}: {
  s: ScoredSubstation;
  terciles: [number, number];
  axisTerciles: Record<Axis, [number, number]>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onExport: () => void;
}) {
  const scoreOf = useExplorerScore();
  const result = s.scoreResult;
  const tier = tierMeta(s.modelTier);
  const two = scoreOf(s);
  const hazards = hazardReadings(s);
  return (
    <div className="border-t border-white/5 bg-white/[0.02] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white">{s.name}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {s.county} County, {s.state} · {s.region} ·{" "}
            {s.hasActiveQueue ? "active queue" : "no active queue"}
            {collapsed && (
              <>
                {" · "}
                <span className="text-neutral-400">
                  {result != null
                    ? `Score ${result.score}`
                    : s.hasActiveQueue
                    ? "not scored"
                    : "no active queue"}
                  {s.medianNetworkCostPerKw != null &&
                    ` · $${Math.round(s.medianNetworkCostPerKw)}/kW`}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onExport}
            className="rounded border border-white/10 px-2.5 py-1 text-[11px] text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
          >
            Export
          </button>
          <button
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand details" : "Minimize details"}
            aria-expanded={!collapsed}
            className="rounded border border-white/10 p-1 text-neutral-400 transition-colors hover:border-white/25 hover:text-white"
          >
            <Chevron up={!collapsed} />
          </button>
        </div>
      </div>

      {/* Everything below the header collapses to a single line when
          minimized, so the map/list can take the space back. */}
      {!collapsed && (
        <>
      {/* Two-axis summary badges up top — the at-a-glance read before the
          separated Power and Risk sections below. */}
      <div className="mt-3 flex items-center gap-2">
        <AxisBadges s={s} axisTerciles={axisTerciles} size="md" />
        <span className="text-[10px] text-neutral-600">
          Power · Risk · Combined
        </span>
      </div>

      {/* ── POWER AXIS ──────────────────────────────────────────────────
          Interconnection suitability. The existing four-component breakdown —
          a separate axis from RISK below, by design; the two are never merged
          into one verdict. */}
      <Section title="Power — interconnection suitability">
        {result != null ? (
          <>
            <div className="flex items-baseline gap-3">
              <span
                className="font-tele text-3xl font-semibold"
                style={{ color: scoreColor(result.score, terciles) }}
              >
                {result.score}
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: scoreColor(result.score, terciles) }}
              >
                {scoreBandLabel(result.score, terciles)}
              </span>
              <span className="ml-auto text-[11px] text-neutral-500">
                relative within the current view
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <ComponentBar
                label="Scale"
                value={result.components.scale}
                caption={`${mw(s.queuedMw)} has queued here`}
              />
              <ComponentBar
                label="Phantom"
                value={result.components.phantom}
                caption={
                  s.avgWithdrawRate != null
                    ? `${pct(s.avgWithdrawRate)} of that queue historically withdraws`
                    : "no withdrawal estimate for this queue"
                }
              />
              <ComponentBar
                label="Cost"
                value={result.components.cost}
                caption={
                  result.imputed.cost
                    ? "estimated from the national median — no study data here"
                    : `$${Math.round(s.medianNetworkCostPerKw as number).toLocaleString()}/kW median to connect`
                }
              />
              <ComponentBar
                label="Viability"
                value={result.components.viability}
                caption={
                  s.histWithdrawRate != null
                    ? `${pct(s.histWithdrawRate)} of past projects withdrew here`
                    : "no historical track record — assumed neutral"
                }
              />
            </div>

            <div className="mt-3 text-[11px] text-neutral-500">
              Confidence: {Math.round(result.confidence * 100)}%
              {confidenceReason(s, result) && (
                <> — {confidenceReason(s, result)}</>
              )}
            </div>
          </>
        ) : (
          <p className="text-[11px] leading-relaxed text-neutral-500">
            No active queue — this substation isn&apos;t scored. There&apos;s
            nothing currently in the queue to rank.
          </p>
        )}
      </Section>

      {/* ── RISK AXIS ───────────────────────────────────────────────────
          Natural-hazard exposure (FEMA National Risk Index), a SEPARATE axis
          from Power above — deliberately not merged. Higher riskScore = safer.
          One horizontal bar per hazard, worst on top; "no risk data" when the
          dataset carries no hazard fields. */}
      <Section title="Risk — natural-hazard exposure">
        {two.riskScore != null && hazards.length > 0 ? (
          <>
            <div className="flex items-baseline gap-3">
              <span
                className="font-tele text-3xl font-semibold"
                style={{ color: axisColor(two.riskScore, axisTerciles.risk) }}
              >
                {two.riskScore}
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: axisColor(two.riskScore, axisTerciles.risk) }}
              >
                {bandLabel(two.riskScore, axisTerciles.risk)}
              </span>
              <span className="ml-auto text-[11px] text-neutral-500">
                higher = safer
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {[...hazards]
                .sort((a, b) => b.score - a.score)
                .map((h) => (
                  <HazardBar key={h.key} label={h.label} score={h.score} />
                ))}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
              {dominantHazardsCaption(s)} FEMA scores are county-level composite
              risk (0–100, higher = worse) — a first-pass screen, not a
              site-specific assessment.
            </p>
          </>
        ) : (
          <p className="text-[11px] leading-relaxed text-neutral-500">
            No risk data — this substation carries no FEMA hazard scores, so a
            risk score can&apos;t be computed.
          </p>
        )}
      </Section>

      {/* ── COMBINED ────────────────────────────────────────────────────
          The headline visual: where this site sits on Power × Risk. Top-right
          is strong on both. Shows the tradeoff rather than a single verdict. */}
      <Section title="Combined — power × risk">
        {two.combined != null ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <span
                className="font-tele text-3xl font-semibold"
                style={{ color: axisColor(two.combined, axisTerciles.combined) }}
              >
                {two.combined}
              </span>
              <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                {bandLabel(two.combined, axisTerciles.combined)} · penalizes
                sites lopsided on either axis
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <QuadrantChart items={[s]} highlightId={s.id} />
            </div>
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed text-neutral-500">
            No combined score — it needs BOTH a Power and a Risk score, and this
            site is missing one (
            {two.powerScore == null ? "no power score" : "no risk data"}).
          </p>
        )}
      </Section>

      {/* Model reliability — the survival model's predictive quality varies by
          region; this is the honesty caveat on the score above. */}
      <Section title="Model reliability">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-2 py-0.5 font-tele text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: tier.color + "22", color: tier.color }}
          >
            {tier.label}
          </span>
          <span className="text-[11px] text-neutral-500">
            {s.regionConcordance != null
              ? `${s.region} concordance ${s.regionConcordance.toFixed(3)}`
              : `${s.region} — not validated`}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          {tier.blurb} Withdrawal rates themselves are empirical (observed
          history), not model output.
        </p>
      </Section>

      {/* Queue reality */}
      <Section title="Queue reality">
        {s.hasActiveQueue ? (
          <>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Of {mw(s.queuedMw)} queued here, roughly{" "}
              <span className="text-neutral-300">{mw(s.likelyWithdrawMw)}</span>{" "}
              sits behind projects that historically withdraw, leaving about{" "}
              <span className="text-neutral-300">{mw(s.adjustedMw)}</span>{" "}
              likely real.
            </p>
            <StackedBar
              queued={s.queuedMw}
              likelyWithdraw={s.likelyWithdrawMw}
              adjusted={s.adjustedMw}
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
              <span>
                {mw(s.queuedMw)} queued <span className="text-neutral-600">→</span>{" "}
                <span className="text-neutral-300">{mw(s.adjustedMw)} likely real</span>
              </span>
              {s.avgWithdrawRate != null && (
                <span>{pct(s.avgWithdrawRate)} avg. withdrawal</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-[11px] leading-relaxed text-neutral-500">
            No projects are currently queued here — nothing to show.
          </p>
        )}
      </Section>

      {/* Cost to connect */}
      <Section title="Cost to connect">
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Historical median. Actual cost depends on project size, type, and
          timing.
        </p>
        {s.medianNetworkCostPerKw != null ? (
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-tele text-2xl font-medium text-white">
              ${Math.round(s.medianNetworkCostPerKw).toLocaleString()}
            </span>
            <span className="text-xs text-neutral-500">/kW</span>
            <span className="ml-auto text-[11px] text-neutral-500">
              based on {s.nProjectsWithCost} studied{" "}
              {s.nProjectsWithCost === 1 ? "project" : "projects"}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-neutral-500">No cost data.</p>
        )}
      </Section>

      {/* Track record */}
      <Section title="Track record">
        {s.histProjects > 0 ? (
          <p className="text-[11px] leading-relaxed text-neutral-500">
            <span className="text-neutral-300">
              {s.histProjects} {s.histProjects === 1 ? "project" : "projects"}
            </span>{" "}
            attempted here historically
            {s.histWithdrawRate != null && (
              <>
                , <span className="text-neutral-300">{pct(s.histWithdrawRate)}</span>{" "}
                withdrew
              </>
            )}
            .
          </p>
        ) : (
          <p className="text-[11px] text-neutral-500">No historical projects on record.</p>
        )}
      </Section>

      {/* Location */}
      <Section title="Location" last>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <Field label="County" value={s.county} />
          <Field label="State" value={s.state} />
          <Field
            label="Map position"
            value={
              s.hasExactCoords
                ? "verified coordinates"
                : "approx. (by county/state)"
            }
          />
          <Field
            label="Precision"
            value={s.hasExactCoords ? s.coordPrecision ?? "verified" : "approximate"}
          />
        </div>
      </Section>
        </>
      )}

      {/* Printable version — hidden on screen, shown only in @media print.
          Always rendered regardless of collapsed state. */}
      <div className="print-report bg-white p-8 text-black">
        <PrintHeader />
        <h1 className="mt-6 text-2xl font-bold">{s.name}</h1>
        <p className="text-sm text-black/60">
          {s.county} County, {s.state} · {s.region} ·{" "}
          {s.hasActiveQueue ? "active queue" : "no active queue"}
          {result != null && ` · GridSolve Site Score ${result.score} (${scoreBandLabel(result.score, terciles)})`}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-black/50">
              Queue reality
            </h2>
            {s.hasActiveQueue ? (
              <p className="mt-1 text-sm">
                Of {mw(s.queuedMw)} queued, roughly {mw(s.likelyWithdrawMw)} sits
                behind projects that historically withdraw, leaving about{" "}
                {mw(s.adjustedMw)} likely real.
              </p>
            ) : (
              <p className="mt-1 text-sm">No active queue.</p>
            )}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-black/50">
              Cost to connect
            </h2>
            <p className="mt-1 text-sm">
              {s.medianNetworkCostPerKw != null
                ? `$${Math.round(s.medianNetworkCostPerKw).toLocaleString()}/kW median, based on ${s.nProjectsWithCost} studied projects.`
                : "No cost data."}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-black/50">
              Track record
            </h2>
            <p className="mt-1 text-sm">
              {s.histProjects > 0
                ? `${s.histProjects} projects attempted${
                    s.histWithdrawRate != null
                      ? `, ${pct(s.histWithdrawRate)} withdrew`
                      : ""
                  }.`
                : "No historical projects on record."}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-black/50">
              Model reliability
            </h2>
            <p className="mt-1 text-sm">
              {tier.label} —{" "}
              {s.regionConcordance != null
                ? `${s.region} concordance ${s.regionConcordance.toFixed(3)}.`
                : `${s.region} not validated.`}{" "}
              {tier.blurb}
            </p>
          </div>
        </div>

        <PrintFooter />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`mt-4 border-t border-white/5 pt-4 ${last ? "" : ""}`}>
      <h3 className="text-xs font-medium text-neutral-200">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${up ? "" : "rotate-180"}`}
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

// One labeled 0-1 bar for a score component, with the real number that
// backs it printed underneath — the score is never just an opaque bar.
function ComponentBar({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  const widthPct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[11px]">
        <span className="text-neutral-300">{label}</span>
        <span className="font-tele text-neutral-500">{widthPct}%</span>
      </div>
      <div className="h-1.5 rounded bg-white/5">
        <div
          className="h-1.5 rounded bg-[var(--accent)]"
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-neutral-600">{caption}</div>
    </div>
  );
}

// One horizontal bar for a single FEMA hazard (0–100, higher = worse). Bars
// are colored on a red gradient by severity so the worst exposures read hot.
function HazardBar({ label, score }: { label: string; score: number }) {
  const clamped = Math.min(Math.max(score, 0), 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[11px]">
        <span className="text-neutral-300">{label}</span>
        <span className="font-tele text-neutral-500">{Math.round(score)}</span>
      </div>
      <div className="h-1.5 rounded bg-white/5">
        <div
          className="h-1.5 rounded"
          style={{
            width: `${clamped}%`,
            backgroundColor: AXIS_COLOR_LOW,
            opacity: 0.4 + (clamped / 100) * 0.6,
          }}
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-600">{label}</dt>
      <dd className="mt-0.5 text-neutral-300">{value}</dd>
    </div>
  );
}

// A single bar split into "delivered" (adjusted) vs "likely withdraws"
// segments, scaled against total queued MW.
function StackedBar({
  queued,
  likelyWithdraw,
  adjusted,
}: {
  queued: number;
  likelyWithdraw: number;
  adjusted: number;
}) {
  const total = queued > 0 ? queued : 1;
  const adjustedPct = (adjusted / total) * 100;
  const withdrawPct = (likelyWithdraw / total) * 100;

  return (
    <div className="mt-3 flex h-3 w-full overflow-hidden rounded bg-white/5">
      <div
        className="h-full bg-[var(--accent)]"
        style={{ width: `${adjustedPct}%` }}
        title={`${mw(adjusted)} likely real`}
      />
      <div
        className="h-full bg-white/15"
        style={{ width: `${withdrawPct}%` }}
        title={`${mw(likelyWithdraw)} likely withdraws`}
      />
    </div>
  );
}
