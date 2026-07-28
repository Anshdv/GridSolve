"use client";

// Shown to signed-in users who don't yet have full explorer access. Instead of
// hiding everything behind a contact wall, we give a genuine taste: the top few
// substations by Levora Site Score — real scores, real numbers — then a prompt
// to contact us to unlock the rest.
import { scoreColor, type ScoredSubstation } from "@/lib/siteScore";
import { getExplorerAccessEmail } from "@/lib/explorerAccess";

const mw = (n: number) => `${Math.round(n).toLocaleString()} MW`;

export default function ExplorerTeaser({
  items,
  terciles,
  total,
  selectedName,
  onSelect,
}: {
  items: ScoredSubstation[];
  terciles: [number, number];
  total: number;
  selectedName: string | null;
  onSelect: (s: ScoredSubstation) => void;
}) {
  const email = getExplorerAccessEmail();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="border-b border-white/5 bg-[var(--accent)]/[0.05] px-5 py-2.5">
        <p className="font-tele text-[11px] uppercase tracking-[0.14em] text-[var(--accent-bright)]">
          Preview · top-scored sites
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
              title="Levora Site Score"
            >
              {score != null ? score : "—"}
            </span>
          </button>
        );
      })}

      {/* Contact-to-unlock prompt, directly below the teaser rows. */}
      <div className="border-t border-white/10 bg-white/[0.02] px-5 py-7 text-center">
        <h3 className="font-display text-base font-semibold tracking-tight text-white [text-wrap:balance]">
          This is just a taste of Levora.
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-400">
          You&apos;re previewing {items.length} of{" "}
          <span className="text-neutral-200">{total.toLocaleString()}</span>{" "}
          scored substations. Unlock the full list, filters, side-by-side
          comparison, and per-site detail panels.
        </p>
        <a
          href={`mailto:${email}?subject=Levora%20explorer%20access%20request`}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-5 py-2.5 text-sm font-medium text-[var(--accent-bright)] transition-colors hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15"
        >
          Contact {email} to access all of them
          <span aria-hidden>→</span>
        </a>
        <p className="mx-auto mt-4 max-w-xs text-[11px] leading-relaxed text-neutral-600">
          Include the email you signed up with so we can grant access to the
          right account.
        </p>
      </div>
    </div>
  );
}
