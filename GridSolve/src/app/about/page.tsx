import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { datasetStats } from "@/lib/data";
import {
  LEGAL_EMAIL,
  getLegalEntityName,
  getLegalMailingAddress,
} from "@/lib/legal";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata.about,
  openGraph: {
    title: `${pageMetadata.about.title} — GridSolve`,
    description: pageMetadata.about.description,
    url: "/about",
  },
  twitter: {
    title: `${pageMetadata.about.title} — GridSolve`,
    description: pageMetadata.about.description,
  },
};

export default function About() {
  const entity = getLegalEntityName();
  const address = getLegalMailingAddress();

  return (
    <main className="min-h-screen bg-[#07080a] text-neutral-200">
      <SiteNav />

      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white [text-wrap:balance] md:text-4xl">
          About GridSolve
        </h1>
        <p className="mt-4 max-w-[70ch] text-[15.5px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
          GridSolve is an interconnection intelligence tool for data center
          developers, built and operated by{" "}
          <span className="text-neutral-200">{entity}</span>.
        </p>

        <Section title="What we build">
          <p>
            Most of the capacity in U.S. interconnection queues withdraws before
            it is built, but the queue counts it as real. GridSolve predicts
            which projects will withdraw and re-scores{" "}
            <span className="text-neutral-200">
              {datasetStats.total.toLocaleString("en-US")} substations
            </span>{" "}
            by the megawatts likely to remain — alongside the historical cost to
            connect and the natural-hazard risk at each site, on one screen.
          </p>
        </Section>

        <Section title="Who we are">
          <p>
            <span className="text-neutral-200">Ansh Devlekar</span> — Founder
            and CEO, {entity}. GridSolve started as a project to answer one
            question developers keep asking: where can a data center actually
            get power? It now runs as a commercial product under {entity}.
          </p>
        </Section>

        <Section title="Contact" last>
          <dl className="grid max-w-[70ch] grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-neutral-500">Company</dt>
            <dd className="text-neutral-200">{entity}</dd>
            <dt className="text-neutral-500">Email</dt>
            <dd>
              <a
                href={`mailto:${LEGAL_EMAIL}`}
                className="text-neutral-200 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/50"
              >
                {LEGAL_EMAIL}
              </a>
            </dd>
            {address ? (
              <>
                <dt className="text-neutral-500">Mail</dt>
                <dd className="text-neutral-200">{address}</dd>
              </>
            ) : null}
          </dl>
        </Section>

        <p className="mt-12 text-[14px] text-neutral-500">
          <Link
            href="/methodology"
            className="text-neutral-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/50"
          >
            How the model works →
          </Link>
        </p>
      </div>
      <SiteFooter />
    </main>
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
    <section className={`mt-12 ${last ? "" : "border-b border-white/5 pb-12"}`}>
      <h2 className="font-display text-lg font-medium text-white [text-wrap:balance]">
        {title}
      </h2>
      <div className="mt-3 text-[15px] leading-relaxed text-neutral-400 [text-wrap:pretty] [&_p]:max-w-[70ch]">
        {children}
      </div>
    </section>
  );
}
