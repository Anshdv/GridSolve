import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import JsonLd from "@/components/JsonLd";
import { faqPageJsonLd, webPageJsonLd } from "@/lib/seo";
import { pageMetadata, seoKeywords, siteFaqs } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata.faqs,
  keywords: [...seoKeywords],
  openGraph: {
    title: `${pageMetadata.faqs.title} — GridSolve`,
    description: pageMetadata.faqs.description,
    url: "/faqs",
  },
  twitter: {
    title: `${pageMetadata.faqs.title} — GridSolve`,
    description: pageMetadata.faqs.description,
  },
};

export default function FaqsPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/faqs",
            title: pageMetadata.faqs.title,
            description: pageMetadata.faqs.description,
          }),
          faqPageJsonLd(siteFaqs),
        ]}
      />
      <main className="min-h-screen bg-[#07080a] text-neutral-200">
        <SiteNav />

        <section className="grid-bg relative overflow-hidden border-b border-white/[0.06]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_15%_0%,rgba(61,123,255,0.16),transparent_58%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-bright)]" />
              <span className="font-tele text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                FAQs
              </span>
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white [text-wrap:balance]">
              What the scores do, and what they don&apos;t.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
              Short answers on the queue, the model, and how to read
              withdrawal-adjusted capacity.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <dl>
            {siteFaqs.map((faq) => (
              <div
                key={faq.question}
                className="border-b border-white/10 py-8 first:pt-0"
              >
                <dt className="font-display text-xl font-semibold tracking-tight text-white [text-wrap:balance]">
                  {faq.question}
                </dt>
                <dd className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-14 flex flex-wrap items-center gap-4">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-bright)]"
            >
              Open the explorer
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/methodology"
              className="text-sm text-neutral-300 transition-colors hover:text-white"
            >
              Read the methodology
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
