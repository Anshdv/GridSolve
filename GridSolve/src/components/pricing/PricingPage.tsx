"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { useExplorerAccess } from "@/hooks/useExplorerAccess";
import { getExplorerContactEmail } from "@/lib/explorerContact";
import { datasetStats } from "@/lib/data-meta";
import {
  PLAN_COMPARISON,
  PLAN_FEATURES,
  PLAN_LABEL,
  PLAN_PRICING,
  type PlanId,
} from "@/lib/plans";

const ORDER: PlanId[] = ["free", "monthly", "yearly"];

const PLAN_BLURB: Record<PlanId, string> = {
  free: `Six of ${datasetStats.total.toLocaleString()} substations. Power only — no write-down.`,
  monthly: "Full catalog for a live hunt. Rank Power. Do not file it.",
  yearly: "The license you put in a memo: Risk, Combined, compare, print, CSV.",
};

export default function PricingPage() {
  const { ready, plan, authenticated } = useExplorerAccess();
  const currentId = authenticated ? plan.id : null;
  const contact = getExplorerContactEmail();
  const requestHref = (subject: string) =>
    `mailto:${contact}?subject=${encodeURIComponent(subject)}`;

  return (
    <main className="min-h-screen bg-[#07080a] text-neutral-200">
      <SiteNav />

      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="font-tele text-[11px] uppercase tracking-[0.16em] text-[var(--accent-bright)]">
          Commercial access
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white [text-wrap:balance] md:text-4xl">
          Screening is a sprint. Diligence is the license.
        </h1>
        <p className="mt-4 max-w-[68ch] text-[15.5px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
          A data-center POI call is a nine-figure mistake. GridSolve is
          withdrawal-adjusted screening — not a utility study. Sample shows the
          instrument. Screening ($3,000/mo) is month-to-month while a site is
          in play. Diligence ($30,000/yr) is what you print and attach.
          Checkout is not live; access is assigned by signed-in email.
        </p>

        <div className="mt-12 grid grid-cols-1 border-y border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-white/10">
          {ORDER.map((id) => {
            const pricing = PLAN_PRICING[id];
            const featured = id === "yearly";
            const current = ready && currentId === id;
            return (
              <section
                key={id}
                className={`px-0 py-10 sm:px-6 sm:first:pl-0 sm:last:pr-0 lg:px-8 ${
                  featured ? "bg-[var(--accent)]/[0.04] sm:bg-transparent" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-white">
                    {PLAN_LABEL[id]}
                  </h2>
                  {featured && (
                    <span className="font-tele text-[10px] uppercase tracking-[0.14em] text-[var(--accent-bright)]">
                      License
                    </span>
                  )}
                </div>
                <p className="mt-4 flex items-end gap-1">
                  <span className="whitespace-nowrap font-tele text-[2rem] font-medium leading-none tracking-normal text-white">
                    {pricing.amount}
                  </span>
                  <span className="pb-0.5 text-sm text-neutral-500">
                    {pricing.cadence}
                  </span>
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {"billedAs" in pricing ? pricing.billedAs : pricing.note}
                  {id === "yearly" ? ` · ${pricing.note}` : ""}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                  {PLAN_BLURB[id]}
                </p>
                <ul className="mt-6 list-none space-y-2.5 text-sm text-neutral-300">
                  {PLAN_FEATURES[id].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span
                        className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-[var(--accent-bright)]"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {current ? (
                    <Link
                      href="/explorer"
                      className="inline-flex rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-bright)] transition-colors hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15"
                    >
                      Your plan · open explorer
                    </Link>
                  ) : id === "free" ? (
                    <Link
                      href="/signup"
                      className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-white/30 hover:text-white"
                    >
                      Sign up for the sample
                    </Link>
                  ) : (
                    <a
                      href={requestHref(
                        id === "yearly"
                          ? "GridSolve Diligence license"
                          : "GridSolve Screening month"
                      )}
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        featured
                          ? "border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-bright)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15"
                          : "border border-white/15 text-neutral-300 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      Request {PLAN_LABEL[id].toLowerCase()}
                    </a>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 border-y border-white/10 py-10 sm:grid-cols-3 sm:gap-0">
          <div className="sm:pr-8">
            <h2 className="font-display text-base font-semibold text-white">
              Who pays this
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400 [text-wrap:pretty]">
              Data-center and generation developers ranking POIs before a
              utility study. Consultants billing a siting sprint. Funds doing
              origination screens.
            </p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:px-8">
            <h2 className="font-display text-base font-semibold text-white">
              What you may use it for
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400 [text-wrap:pretty]">
              Internal screening and IC memos. Diligence print and CSV carry
              the source line and a stamp that this is not an interconnection
              study.
            </p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-8">
            <h2 className="font-display text-base font-semibold text-white">
              What it is not
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400 [text-wrap:pretty]">
              Not an interconnection agreement, load study, engineering stamp,
              or investment advice. Model reliability varies by ISO — read the
              caveat on every site.
            </p>
          </div>
        </div>

        <h2 className="mt-16 font-display text-xl font-semibold tracking-tight text-white [text-wrap:balance]">
          What each plan can do
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Feature comparison across Sample, Screening, and Diligence
            </caption>
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4 font-medium text-neutral-500">
                  Capability
                </th>
                {ORDER.map((id) => (
                  <th
                    key={id}
                    className="px-3 py-3 font-medium text-neutral-200"
                  >
                    {PLAN_LABEL[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-white/[0.06]">
                  <th className="py-3 pr-4 font-medium text-neutral-400">
                    {row.label}
                  </th>
                  {ORDER.map((id) => (
                    <td
                      key={id}
                      className={`px-3 py-3 ${
                        row.values[id] === "—"
                          ? "text-neutral-500"
                          : "text-neutral-200"
                      }`}
                    >
                      {row.values[id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-12 max-w-[68ch] text-[14px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
          Sample is Screening with the catalog clamped to six sites. Screening
          is Power-only on purpose: you are ranking, not filing. Diligence is
          the only plan that surfaces Risk, Combined, compare, print, and CSV
          of the current filter. Extra seats are by request to {contact}.
        </p>

        <p className="mt-8 text-[14px] text-neutral-500">
          <Link
            href="/explorer"
            className="text-neutral-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/50"
          >
            Open the explorer →
          </Link>
        </p>

        <p className="mt-16 border-t border-white/10 pt-6 text-[11px] leading-relaxed text-neutral-500">
          Source: LBNL Queued Up and LBNL interconnection cost studies. Prices
          are the commercial terms; checkout is not wired. GridSolve estimates
          are for site screening — not engineering, legal, or investment
          advice.
        </p>
      </div>
    </main>
  );
}
