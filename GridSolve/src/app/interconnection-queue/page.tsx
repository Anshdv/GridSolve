import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import JsonLd from "@/components/JsonLd";
import { datasetStats, model } from "@/lib/data";
import { webPageJsonLd } from "@/lib/seo";
import { pageMetadata, seoKeywords } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata.interconnectionQueue,
  keywords: [...seoKeywords],
  openGraph: {
    title: `${pageMetadata.interconnectionQueue.title} — GridSolve`,
    description: pageMetadata.interconnectionQueue.description,
    url: "/interconnection-queue",
  },
  twitter: {
    title: `${pageMetadata.interconnectionQueue.title} — GridSolve`,
    description: pageMetadata.interconnectionQueue.description,
  },
};

const withdrawalPct = Math.round(datasetStats.nationalWithdrawalRate * 100);

export default function QueuePage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/interconnection-queue",
          title: pageMetadata.interconnectionQueue.title,
          description: pageMetadata.interconnectionQueue.description,
        })}
      />
      <main className="min-h-screen bg-[#07080a] text-neutral-200">
        <SiteNav />

        <section className="grid-bg relative overflow-hidden border-b border-white/[0.06]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_80%_0%,rgba(61,123,255,0.16),transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--survive)]" />
              <span className="font-tele text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                Queue
              </span>
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance]">
              Most of the queue will never be built.
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
              The U.S. interconnection queue holds terawatts of proposed
              generation. GridSolve predicts which projects drop out and maps
              the{" "}
              <span className="text-neutral-100">
                withdrawal-adjusted capacity
              </span>{" "}
              that is actually deliverable.
            </p>
            <dl className="mt-12 grid max-w-3xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <div>
                <dt className="font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  Withdrawal
                </dt>
                <dd className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--withdraw)] md:text-4xl">
                  {withdrawalPct}%
                </dd>
              </div>
              <div>
                <dt className="font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  Substations
                </dt>
                <dd className="mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {datasetStats.total.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  Regions
                </dt>
                <dd className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--accent-bright)] md:text-4xl">
                  {datasetStats.regions}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Section title="What is the interconnection queue?">
            <p>
              Every ISO and RTO maintains an{" "}
              <span className="text-neutral-100">interconnection queue</span> —
              an ordered backlog of proposed generators, storage, and hybrid
              projects seeking a grid connection. Projects move through
              feasibility, system impact, and facility studies. Capacity shown
              on utility hosting maps often assumes every queued project will
              succeed.
            </p>
            <p className="mt-3">
              Lawrence Berkeley National Laboratory&apos;s Queued Up research
              finds roughly 75% of proposed U.S. interconnection capacity
              withdraws before commercial operation. In this dataset, the
              capacity-weighted national withdrawal rate is{" "}
              <span className="text-neutral-100">{withdrawalPct}%</span> across{" "}
              {datasetStats.activeProjects.toLocaleString()} active projects.
            </p>
          </Section>

          <Section title="Why the prediction matters">
            <p>
              Without{" "}
              <span className="text-neutral-100">
                interconnection queue prediction
              </span>
              , speculative megawatts get treated as firm capacity. A
              substation that looks full may have headroom once likely
              withdrawals are removed. One that looks open may be stuck in
              cluster studies for years.
            </p>
            <p className="mt-3">
              Large loads usually interconnect through a separate utility
              process. Deliverable generation-queue capacity is still a strong
              signal of where grid headroom is likely to exist — a practical
              input before a{" "}
              <span className="text-neutral-100">
                data center interconnection
              </span>{" "}
              study.
            </p>
          </Section>

          <Section title="How GridSolve scores a substation">
            <p>
              A Cox survival model is fit on historical
              generation-interconnection projects. Each active project gets a
              withdrawal probability from attributes knowable near queue entry:
              cluster studies, service type, technology, and the regional base
              rate.
            </p>
            <p className="mt-3">
              Those probabilities roll up to{" "}
              <span className="text-neutral-100">likely withdraw MW</span>.
              Subtracting them from queued megawatts yields{" "}
              <span className="text-neutral-100">adjusted available MW</span>,
              ranked by the GridSolve Site Score.
            </p>
            <p className="mt-3">
              The{" "}
              <Link
                href="/methodology"
                className="text-[var(--accent-bright)] underline-offset-2 hover:underline"
              >
                methodology
              </Link>{" "}
              shows regional validation, data sources, and what the model does
              not claim.
            </p>
          </Section>

          <Section title="Coverage">
            <p>
              GridSolve covers{" "}
              <span className="text-neutral-100">{model.coverage}</span> —{" "}
              {datasetStats.total.toLocaleString()} substations across{" "}
              {datasetStats.regions} ISO/RTO regions and {datasetStats.states}{" "}
              states. Withdrawal rates are computed inside each region from
              that region&apos;s resolved projects. Predictive strength varies,
              and each substation carries its region&apos;s confidence tier.
            </p>
          </Section>

          <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_50%_120%,rgba(61,123,255,0.2),transparent_60%)]" />
            <div className="relative px-8 py-10 text-center">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white [text-wrap:balance]">
                See which substations still have room.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
                Ranked by megawatts that are likely to remain — not by what the
                queue claims.
              </p>
              <Link
                href="/explorer"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-bright)]"
              >
                Open the explorer
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <p className="mt-12 text-[11px] leading-relaxed text-neutral-600">
            Source: ISO/RTO interconnection queues (LBNL Queued Up) and LBNL
            interconnection cost studies.
          </p>
        </article>
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-b border-white/10 pb-12">
      <h2 className="font-display text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      <div className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
        {children}
      </div>
    </section>
  );
}
