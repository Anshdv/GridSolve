import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { datasetStats, model } from "@/lib/data";
import { faqPageJsonLd, webPageJsonLd } from "@/lib/seo";
import { pageMetadata, seoKeywords, siteFaqs } from "@/lib/site";

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

export default function InterconnectionQueuePage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/interconnection-queue",
            title: pageMetadata.interconnectionQueue.title,
            description: pageMetadata.interconnectionQueue.description,
          }),
          faqPageJsonLd(siteFaqs),
        ]}
      />
      <main className="min-h-screen bg-[#07080a] text-neutral-200">
        <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#07080a]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-sm text-neutral-300 transition-colors hover:text-white">
              ← GridSolve
            </Link>
            <Link
              href="/explorer"
              className="text-sm text-neutral-300 transition-colors hover:text-white"
            >
              Explorer →
            </Link>
          </div>
        </header>

        <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <p className="font-tele text-[11px] uppercase tracking-[0.15em] text-neutral-500">
            Grid interconnection · Queue analytics
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl [text-wrap:balance]">
            Interconnection queue prediction for data center site selection
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-neutral-400">
            The U.S. grid interconnection queue holds terawatts of proposed
            generation — but most projects withdraw before they are built.
            GridSolve predicts which queue projects will drop out and maps where{" "}
            <span className="text-neutral-200">withdrawal-adjusted capacity</span>{" "}
            is actually deliverable at substations nationwide.
          </p>

          <Section title="What is the interconnection queue?">
            <p>
              Every ISO and RTO maintains an{" "}
              <span className="text-neutral-200">interconnection queue</span> — a
              ordered backlog of proposed generators, storage, and hybrid projects
              seeking grid connection. Projects move through feasibility, system
              impact, and facility studies. Capacity shown on utility hosting maps
              often assumes every queued project will succeed.
            </p>
            <p className="mt-3">
              Lawrence Berkeley National Laboratory&apos;s Queued Up research
              finds roughly 75% of proposed U.S. interconnection capacity
              withdraws before reaching commercial operation. In GridSolve&apos;s
              dataset, the capacity-weighted national withdrawal rate is{" "}
              <span className="text-neutral-200">{withdrawalPct}%</span> across{" "}
              {datasetStats.activeProjects.toLocaleString()} active projects at{" "}
              {datasetStats.total.toLocaleString()} substations.
            </p>
          </Section>

          <Section title="Why interconnection queue prediction matters">
            <p>
              Without{" "}
              <span className="text-neutral-200">
                interconnection queue prediction
              </span>
              , developers treat speculative megawatts as firm capacity. A
              substation that appears full may have headroom once likely
              withdrawals are removed; one that appears open may be dominated by
              cluster studies that stall for years.
            </p>
            <p className="mt-3">
              For{" "}
              <span className="text-neutral-200">
                data center interconnection
              </span>{" "}
              planning, queue reality matters even though large loads typically
              interconnect through separate utility processes. Deliverable
              generation-queue capacity at a substation is a strong signal of
              where grid headroom is likely to exist — a practical input to site
              selection before committing to interconnection studies.
            </p>
          </Section>

          <Section title="How GridSolve predicts queue withdrawals">
            <p>
              GridSolve fits a Cox proportional-hazards survival model on
              historical generation-interconnection projects. Each active project
              receives a withdrawal probability based on attributes that predict
              dropout: cluster study involvement, service type, technology, queue
              position, and regional base rates.
            </p>
            <p className="mt-3">
              Those probabilities roll up to every substation as{" "}
              <span className="text-neutral-200">likely withdraw MW</span>.
              Subtracting expected withdrawals from queued megawatts yields{" "}
              <span className="text-neutral-200">adjusted available MW</span> —
              withdrawal-adjusted interconnection capacity ranked by the
              GridSolve Site Score.
            </p>
            <p className="mt-3">
              See the full{" "}
              <Link
                href="/methodology"
                className="text-[var(--accent-bright)] underline-offset-2 hover:underline"
              >
                interconnection queue model methodology
              </Link>{" "}
              for regional validation, data sources, and scope limits.
            </p>
          </Section>

          <Section title="National grid interconnection queue coverage">
            <p>
              GridSolve covers{" "}
              <span className="text-neutral-200">{model.coverage}</span> —{" "}
              {datasetStats.total.toLocaleString()} substations across{" "}
              {datasetStats.regions} ISO/RTO regions and {datasetStats.states}{" "}
              states. Withdrawal rates are computed empirically within each
              region from resolved projects; model predictive quality varies by
              region and is surfaced as a confidence tier on each substation.
            </p>
          </Section>

          <Section title="Frequently asked questions">
            <dl className="space-y-8">
              {siteFaqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="font-display text-base font-medium text-white">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-neutral-400">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <div className="mt-16 rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-white">
              Explore withdrawal-adjusted capacity nationwide
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
              Rank substations by deliverable megawatts — not raw interconnection
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

          <p className="mt-12 border-t border-white/10 pt-6 text-[11px] leading-relaxed text-neutral-600">
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
    <section className="mt-12 border-b border-white/5 pb-12">
      <h2 className="font-display text-lg font-medium text-white">{title}</h2>
      <div className="mt-3 text-[15px] leading-relaxed text-neutral-400">
        {children}
      </div>
    </section>
  );
}
