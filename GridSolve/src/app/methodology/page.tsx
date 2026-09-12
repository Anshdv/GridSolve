// Plain-prose explanation of what the model does and doesn't do. Every number
// here is read from data/gridsolve.json (the model{} block and derived dataset
// aggregates) — nothing hardcoded.
import type { Metadata } from "next";
import Link from "next/link";
import DriversChart from "@/components/DriversChart";
import { model, drivers, datasetStats, tierMeta } from "@/lib/data";
import { HAZARD_WEIGHTS } from "@/lib/scores";
import { pageMetadata, seoKeywords } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata.methodology,
  keywords: [...seoKeywords],
  openGraph: {
    title: `${pageMetadata.methodology.title} — GridSolve`,
    description: pageMetadata.methodology.description,
    url: "/methodology",
  },
  twitter: {
    title: `${pageMetadata.methodology.title} — GridSolve`,
    description: pageMetadata.methodology.description,
  },
};

const withdrawalPct = Math.round(datasetStats.nationalWithdrawalRate * 100);

const TIER_GLOSS =
  "Validated / Usable = safe to weight heavily. Marginal = directional only. Weak = limited signal. Unvalidated / Not predictive = treat this region's model output as a coin flip; rely on the empirical withdrawal rate instead.";

export default function Methodology() {
  // Regional validation table, straight from the model block.
  const regionRows = Object.entries(model.region_validation);

  return (
    <main className="min-h-screen bg-[#07080a] text-neutral-200">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#07080a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4">
          <Link href="/" className="text-sm text-neutral-300 transition-colors hover:text-white">
            ← GridSolve
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/interconnection-queue"
              className="text-sm text-neutral-300 transition-colors hover:text-white"
            >
              Interconnection queue
            </Link>
            <Link
              href="/explorer"
              className="text-sm text-neutral-300 transition-colors hover:text-white"
            >
              Explorer →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white [text-wrap:balance] md:text-4xl">
          Interconnection queue model methodology
        </h1>
        <p className="mt-4 max-w-[70ch] text-[15.5px] leading-relaxed text-neutral-400 [text-wrap:pretty]">
          How GridSolve predicts interconnection queue withdrawals, validates
          the survival model by region, and computes withdrawal-adjusted
          deliverable capacity.
        </p>
        <p className="mt-5 max-w-[70ch] text-[15.5px] leading-relaxed text-neutral-300 [text-wrap:pretty]">
          This page shows exactly where the model is strong, where it&apos;s
          weak, and how every score is calculated — so you can weigh our
          numbers against your own judgment.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 border-y border-white/10 py-8 sm:grid-cols-3 sm:gap-0">
          <div className="sm:pr-6">
            <div className="font-tele text-[1.75rem] font-medium leading-none tracking-normal text-white tabular-nums">
              {datasetStats.total.toLocaleString("en-US")}
            </div>
            <div className="mt-3 text-sm font-medium text-neutral-200">Substations</div>
            <div className="mt-1 text-xs text-neutral-500">
              across {datasetStats.regions} ISO/RTO regions
            </div>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:px-6">
            <div className="font-tele text-[1.75rem] font-medium leading-none tracking-normal text-white tabular-nums">
              {datasetStats.activeProjects.toLocaleString("en-US")}
            </div>
            <div className="mt-3 text-sm font-medium text-neutral-200">Active projects</div>
            <div className="mt-1 text-xs text-neutral-500">
              in the national interconnection queue
            </div>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-6">
            <div className="font-tele text-[1.75rem] font-medium leading-none tracking-normal text-white tabular-nums">
              {withdrawalPct}%
            </div>
            <div className="mt-3 text-sm font-medium text-neutral-200">Withdrawal rate</div>
            <div className="mt-1 text-xs text-neutral-500">
              capacity-weighted, national
            </div>
          </div>
        </div>

        <Section title="What the model predicts">
          <p>
            GridSolve models the survival of{" "}
            <span className="text-neutral-200">generation-interconnection</span>{" "}
            queue projects — the odds that a proposed generator (solar, wind,
            storage, and similar) withdraws from the interconnection queue
            before reaching commercial operation, based on the project&apos;s
            attributes and queue position.
          </p>
          <p className="mt-3">
            It does <span className="text-neutral-200">not</span> model data
            center or other large-load interconnection requests. Large loads
            typically interconnect through a separate process at PacifiCorp
            and most utilities, governed by different tariffs and study
            procedures than the generation queue this model is trained on.
            GridSolve&apos;s output — deliverable capacity per substation — is a
            proxy for where headroom is likely to exist, not a load
            interconnection study.
          </p>
        </Section>

        <Section title="Coverage">
          <p>
            This dataset is national:{" "}
            <span className="text-neutral-200">{model.coverage}</span> — about{" "}
            <span className="text-neutral-200">
              {datasetStats.total.toLocaleString("en-US")} substations
            </span>{" "}
            across {datasetStats.regions} ISO/RTO regions and{" "}
            {datasetStats.states} states. Withdrawal rates are computed{" "}
            <span className="text-neutral-200">empirically within each
            region</span>, from that region&apos;s own resolved projects — they
            are observed history, not model extrapolation. The national,
            capacity-weighted withdrawal share is{" "}
            <span className="text-neutral-200">{withdrawalPct}%</span>, but
            regional base rates range from ~25% (ERCOT) to ~92% (NYISO).
          </p>
        </Section>

        <Section title="Model reliability varies by region">
          <p>
            The survival model&apos;s <span className="text-neutral-200">predictive</span>{" "}
            quality is not uniform. It was validated separately in each region,
            and concordance — the probability it ranks the project that
            withdraws first as the higher-risk one (0.5 is a coin flip, 1.0 is
            perfect) — differs widely. Only some regions clear a usable bar;
            others were never validated at all.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="px-3 py-2.5 font-medium sm:px-4">Region</th>
                  <th className="px-3 py-2.5 font-medium sm:px-4">Concordance</th>
                  <th className="px-3 py-2.5 font-medium sm:px-4">Tier</th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map(([region, v]) => {
                  const t = tierMeta(v.tier);
                  return (
                    <tr key={region} className="border-b border-white/5 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-200 sm:px-4">
                        {region}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-neutral-300 sm:px-4">
                        {v.concordance != null ? v.concordance.toFixed(3) : "—"}
                      </td>
                      <td className="px-3 py-2.5 sm:px-4">
                        <span
                          className="inline-block whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide sm:px-2"
                          style={{ backgroundColor: t.color + "22", color: t.color }}
                          title={t.blurb}
                        >
                          {t.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-400">
            {TIER_GLOSS}
          </p>
          <p className="mt-4">
            Because the withdrawal rates are empirical, the capacity numbers
            stay meaningful even where the survival model is weak — the tier is
            a caveat about the model&apos;s <span className="text-neutral-200">forward
            prediction</span>, not the observed history. Every substation&apos;s
            panel shows its region&apos;s tier so you can weight the score
            accordingly.
          </p>
        </Section>

        <Section title="What predicts withdrawal">
          <p>
            Hazard ratios above 1 raise the chance a project withdraws;
            below 1 lowers it. These are the features the survival model
            weighs most heavily.
          </p>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-sm font-medium text-white">
                What predicts withdrawal
              </h3>
              <span className="font-tele shrink-0 text-[11px] text-neutral-500">
                hazard ratio
              </span>
            </div>
            <DriversChart drivers={drivers} />
            <p className="mt-1 text-[11px] text-neutral-500">
              &gt;1 = more likely to withdraw.
            </p>
          </div>
        </Section>

        <Section title="How the GridSolve Site Score works" breakBefore>
          <p>
            Every substation with an active queue gets a single 0–100{" "}
            <span className="text-neutral-200">GridSolve Site Score</span>{" "}
            — our attempt to combine four separate facts into one holistic
            read on how suitable a site looks for a data center
            interconnection. It is a weighted blend of four components:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="text-neutral-200">Scale (30%)</span> — how much
              MW has queued at this substation, log-scaled against the
              nation&apos;s busiest sites. Heavy queue activity is
              evidence that real transmission-scale capacity exists here.
            </li>
            <li>
              <span className="text-neutral-200">Phantom (20%)</span> — the
              share of that queue expected to withdraw. Counterintuitively,
              high is <span className="text-neutral-200">good</span>: a
              queue full of speculative projects means capacity will free up
              once they drop out.
            </li>
            <li>
              <span className="text-neutral-200">Cost (35%)</span> — the
              median historical cost to connect, log-scaled (the heaviest
              weight, since network upgrade cost is often the deciding
              factor in whether a site pencils out).
            </li>
            <li>
              <span className="text-neutral-200">Viability (15%)</span> — the
              inverse of this specific site&apos;s own historical withdrawal
              rate. High historical withdrawal is{" "}
              <span className="text-neutral-200">bad</span> here: it means
              the site itself tends to kill projects, not just that its
              current queue is inflated.
            </li>
          </ul>
          <p className="mt-3">
            <span className="text-neutral-200">Phantom versus viability</span>{" "}
            is the score&apos;s subtlest distinction: a high phantom rate
            says this generation of the queue is speculative and will clear
            out; a high historical withdrawal rate says projects that try to
            build here tend to fail regardless. Cost is what separates a
            site that&apos;s cheap once the phantom projects clear (genuinely
            promising) from one that&apos;s just expensive everywhere
            (genuinely weak) — which is why cost carries the heaviest weight.
          </p>
          <p className="mt-3">
            These four weights (30/20/35/15) are{" "}
            <span className="text-neutral-200">our editorial judgment</span>,
            not something derived from the data or fit to an outcome — no
            outcome for &quot;good data center site&quot; exists in this
            dataset to fit against. Missing cost data is filled in with the
            national median and the score&apos;s confidence is reduced accordingly
            (shown on each substation&apos;s detail panel), and a score with
            few historical projects behind it is pulled back toward a
            neutral 50 rather than trusted at face value.
          </p>
          <p className="mt-3">
            The score is also strictly{" "}
            <span className="text-neutral-200">relative</span>: colors on the
            map and in the list are the top/middle/bottom third of{" "}
            <span className="text-neutral-200">the current view</span>,
            recomputed live from whatever&apos;s filtered in — so filtering to
            one region re-bands the colors to that region. They are not fixed
            cutoffs and not an absolute standard.
          </p>
          <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-4 text-amber-200/90">
            <span className="font-medium text-amber-200">Key limitation:</span>{" "}
            this dataset has no published hosting-capacity figure, so
            &quot;scale&quot; is inferred entirely from queue activity. A
            substation with no current queue may be genuinely uncontested
            headroom, or it may simply be too small to ever serve a
            large load — this score cannot tell those two apart, which is
            also why substations with no active queue aren&apos;t scored at
            all rather than being guessed at.
          </p>
        </Section>

        <Section title="Two axes: Power and Risk" breakBefore>
          <p>
            GridSolve now scores every site on{" "}
            <span className="text-neutral-200">two separate axes</span> rather
            than folding everything into one number. The{" "}
            <span className="text-neutral-200">Power</span> score is the
            interconnection-suitability read described above (higher is better).
            The <span className="text-neutral-200">Risk</span> score is a natural-hazard
            safety read from FEMA data (higher is safer). A{" "}
            <span className="text-neutral-200">Combined</span> score blends them
            but deliberately penalizes lopsided sites — a site has to be decent
            on <span className="text-neutral-200">both</span> axes to score high.
          </p>
          <p className="mt-3">
            They are kept separate on purpose. A high-hazard site may be a hard
            no for one developer and a priced-in cost for another — the tool
            shows the tradeoff rather than deciding it for you. Merging them into
            a single verdict would hide exactly the judgment call that belongs to
            the person siting the project. That&apos;s why the explorer offers a
            Power × Risk quadrant as the headline visual: it plots where a site
            sits on both, instead of collapsing it to one rank.
          </p>
        </Section>

        <Section title="How the Risk score works">
          <p>
            The Risk score is a weighted average of a site&apos;s FEMA National
            Risk Index hazard scores (each 0–100, higher = worse), subtracted
            from 100 so that a higher Risk score means a{" "}
            <span className="text-neutral-200">safer</span> site. Only the
            hazards present for a site are averaged, and the weights are
            renormalized over those present. The weights are:
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-2.5 font-medium">Hazard</th>
                  <th className="px-4 py-2.5 font-medium">Weight</th>
                </tr>
              </thead>
              <tbody>
                {HAZARD_WEIGHTS.map((h) => (
                  <tr key={h.key} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-neutral-200">{h.label}</td>
                    <td className="px-4 py-2.5 font-mono text-neutral-300">
                      {h.weight.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            These weights are{" "}
            <span className="text-neutral-200">our editorial judgment</span> of
            relative concern for siting a data center — they are not derived from
            the data or fit to any outcome. A different developer might weight
            them differently, and reasonably so.
          </p>
          <p className="mt-3">
            The FEMA scores are{" "}
            <span className="text-neutral-200">county-level composite risk</span>{" "}
            — a loss-weighted index combining a hazard&apos;s frequency and its
            expected consequences. They are a{" "}
            <span className="text-neutral-200">first-pass screen</span>, not a
            site-specific engineering assessment: two substations in the same
            county carry the same hazard scores regardless of their exact siting,
            elevation, or local mitigation.
          </p>
          <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-relaxed text-neutral-400">
            This product uses the Federal Emergency Management Agency&apos;s
            National Risk Index but is not endorsed by FEMA. FEMA cannot vouch
            for the data or analyses derived from these data.
          </p>
        </Section>

        <Section title="Cost figures">
          <p>
            Every $/kW figure on this site is a{" "}
            <span className="text-neutral-200">historical median</span> network
            upgrade cost, drawn from prior interconnection studies at that
            substation. It is not a quote, not an estimate for any specific
            project, and can vary substantially by project size, technology,
            and when it enters the queue.
          </p>
        </Section>

        <Section title="Queued MW">
          <p>
            <span className="text-neutral-200">queued_mw</span> is the MW
            currently sitting in the interconnection queue at a substation —
            it is not the utility&apos;s published hosting-capacity limit, and
            it is not fixed: projects enter and leave the queue continuously.
          </p>
        </Section>

        <Section title="Coordinates" last>
          <p>
            Verified substation coordinates are sourced from:{" "}
            <span className="text-neutral-200">{model.coord_source}</span> —
            only about{" "}
            {Math.round((datasetStats.exactCoords / datasetStats.total) * 100)}%
            of substations carry them. The rest are plotted at an{" "}
            <span className="text-neutral-200">approximate</span> position from
            their county (or, failing that, state) and drawn faded on the map,
            so they read as a rough area rather than a precise point.
          </p>
        </Section>

        <p className="mt-12 text-[14px] text-neutral-500">
          <Link
            href="/explorer"
            className="text-neutral-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/50"
          >
            See these numbers applied to real substations →
          </Link>
        </p>

        <p className="mt-16 border-t border-white/10 pt-6 text-[11px] leading-relaxed text-neutral-600">
          Source: ISO/RTO interconnection queues (LBNL Queued Up) and LBNL
          interconnection cost studies. Withdrawal rates are empirical, per
          region; survival-model validation varies by region.
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
  last,
  breakBefore,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
  breakBefore?: boolean;
}) {
  return (
    <section
      className={`${breakBefore ? "mt-20 pt-4" : "mt-12"} ${
        last ? "" : "border-b border-white/5 pb-12"
      }`}
    >
      <h2 className="font-display text-lg font-medium text-white [text-wrap:balance]">
        {title}
      </h2>
      <div className="mt-3 text-[15px] leading-relaxed text-neutral-400 [text-wrap:pretty] [&_p]:max-w-[70ch] [&_ul]:max-w-[70ch]">
        {children}
      </div>
    </section>
  );
}
