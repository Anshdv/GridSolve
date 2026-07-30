"use client";

// GridSolve landing page. Dark, technical, instrument-grade — the design carries
// the brand. Motion is orchestrated per section (not one uniform fade), and
// every number is read from data/gridsolve.json via the data module. Scroll
// reveals are blank-proof (see components/Reveal) — content never depends on an
// observer firing to become visible.
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import DriversChart from "@/components/DriversChart";
import QueueField from "@/components/QueueField";
import CountUp from "@/components/CountUp";
import ScrollBeam from "@/components/ScrollBeam";
import { Reveal, RevealGroup, revealItem, useCanAnimate } from "@/components/Reveal";
import { drivers, datasetStats } from "@/lib/data";
import UserMenu from "@/components/auth/UserMenu";

const EASE = [0.16, 1, 0.3, 1] as const; // ease-out-expo

// Capacity-weighted national withdrawal share, derived from the dataset.
const withdrawalPct = Math.round(datasetStats.nationalWithdrawalRate * 100);
const survivePct = 100 - withdrawalPct;

export default function HomePage() {
  const canAnimate = useCanAnimate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#07080a]">
      <ScrollBeam />
      <Nav canAnimate={canAnimate} />
      <Hero canAnimate={canAnimate} />
      <Problem />
      <HowItWorks />
      <ModelSection />
      <Stats />
      <FinalCta />
      <Footer />
    </main>
  );
}

/* ---------------------------------------------------------------- Nav */

function Nav({ canAnimate }: { canAnimate: boolean }) {
  return (
    <motion.header
      initial={canAnimate ? { opacity: 0, y: -16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080a]/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[17px] font-semibold tracking-tight text-white">
            GridSolve
          </span>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu />
          <span
            className="hidden h-4 w-px shrink-0 bg-white/10 sm:block"
            aria-hidden
          />
          <Link
            href="/explorer"
            className="group flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-sm text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
          >
            Explorer
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function LogoMark() {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <span className="absolute inset-0 rounded-[7px] border border-[var(--accent)]/40" />
      <motion.span
        className="h-2 w-2 rounded-[2px] bg-[var(--accent-bright)]"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ boxShadow: "0 0 10px 0 var(--accent)" }}
      />
    </span>
  );
}

/* --------------------------------------------------------------- Hero */

function Hero({ canAnimate }: { canAnimate: boolean }) {
  const line1 = "Where data centers".split(" ");
  const line2 = "can actually get power.".split(" ");

  return (
    <section className="grid-bg relative border-b border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_75%_0%,rgba(61,123,255,0.12),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-32">
        {/* Left: copy */}
        <div className="min-w-0">
          <motion.div
            initial={canAnimate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--survive)]" />
            <span className="font-tele text-[11px] uppercase tracking-[0.15em] text-neutral-400">
              Interconnection intelligence
            </span>
          </motion.div>

          <h1 className="font-display text-[clamp(2.15rem,7vw,4.6rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
            <HeroLine words={line1} delay={0.15} canAnimate={canAnimate} />
            <HeroLine
              words={line2}
              delay={0.15 + line1.length * 0.08}
              canAnimate={canAnimate}
              accentLast
            />
          </h1>

          <motion.p
            initial={canAnimate ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: canAnimate ? 0.7 : 0 }}
            className="mt-7 max-w-xl text-[17px] leading-relaxed text-neutral-400"
          >
            GridSolve applies{" "}
            <span className="text-neutral-200">interconnection queue prediction</span>{" "}
            to re-score every U.S. substation by{" "}
            <span className="text-neutral-200">withdrawal-adjusted capacity</span>{" "}
            — the grid interconnection megawatts likely to remain once dead queue
            projects drop out.
          </motion.p>

          <motion.div
            initial={canAnimate ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: canAnimate ? 0.85 : 0 }}
            className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <MagneticCta href="/explorer">Open the explorer</MagneticCta>
            <span className="font-tele text-[12px] text-neutral-500">
              {datasetStats.total.toLocaleString()} substations ·{" "}
              {datasetStats.regions} regions
            </span>
          </motion.div>
        </div>

        {/* Right: living diagram */}
        <motion.div
          initial={canAnimate ? { opacity: 0, scale: 0.96 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: canAnimate ? 0.35 : 0 }}
          className="relative aspect-[4/3] w-full lg:aspect-auto lg:h-[420px]"
        >
          <QueueField />
          <div className="mt-3 flex items-center justify-between px-1 font-tele text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px] bg-[var(--accent-bright)]" />
              survives · deliverable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px] bg-neutral-700" />
              withdraws · vapor
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HeroLine({
  words,
  delay,
  canAnimate,
  accentLast,
}: {
  words: string[];
  delay: number;
  canAnimate: boolean;
  accentLast?: boolean;
}) {
  return (
    <motion.span
      className="flex flex-wrap items-end"
      initial={canAnimate ? "hidden" : "show"}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: canAnimate ? 0.08 : 0,
            delayChildren: canAnimate ? delay : 0,
          },
        },
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ marginRight: i < words.length - 1 ? "0.26em" : undefined }}
        >
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: canAnimate ? "110%" : 0 },
                show: { y: 0, transition: { duration: 0.8, ease: EASE } },
              }}
              style={
                accentLast && i === words.length - 1
                  ? { color: "var(--accent-bright)" }
                  : undefined
              }
            >
              {w}
            </motion.span>
          </span>
        ))}
      </motion.span>
  );
}

function MagneticCta({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="inline-block"
    >
      <Link
        href={href}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-6px_rgba(61,123,255,0.6)] transition-colors hover:bg-[var(--accent-bright)]"
      >
        <span className="relative z-10">{children}</span>
        <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------ Problem */

function Problem() {
  return (
    <section className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal
          as="h2"
          amount={0.5}
          className="max-w-3xl font-display text-[clamp(1.8rem,3.5vw,2.9rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white [text-wrap:balance]"
        >
          Utility hosting-capacity maps count dead queue projects as if they were
          real.
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <RevealGroup
            stagger={0.12}
            className="space-y-5 text-[15.5px] leading-relaxed text-neutral-400"
          >
            <motion.p variants={revealItem}>
              A developer looking at published capacity sees megawatts already
              spoken for by speculative projects — most of which will never be
              built. Promising sites look full; full sites look promising.
            </motion.p>
            <motion.p variants={revealItem}>
              Lawrence Berkeley National Laboratory finds roughly{" "}
              <span className="text-neutral-200">75% of proposed capacity</span>{" "}
              in U.S. interconnection queues ultimately withdraws before reaching
              commercial operation.
            </motion.p>
            <motion.p variants={revealItem}>
              In this data, GridSolve&apos;s model estimates a base withdrawal rate
              of <span className="text-neutral-200">{withdrawalPct}%</span>.
              Adjust for that, and the map of where power is actually deliverable
              looks very different.
            </motion.p>
          </RevealGroup>

          <WithdrawalBar />
        </div>
      </div>
    </section>
  );
}

function WithdrawalBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [fallback, setFallback] = useState(false);
  const canAnimate = useCanAnimate();
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), 1100);
    return () => clearTimeout(t);
  }, []);
  const fill = !canAnimate || inView || fallback;

  return (
    <Reveal className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <div ref={ref}>
        <div className="flex items-baseline justify-between font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          <span>Queued capacity, this dataset</span>
          <span>100%</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--withdraw)]/15 bg-[var(--withdraw)]/[0.04] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[var(--withdraw)]" />
              <span className="font-tele text-[11px] text-neutral-500">
                Withdraws
              </span>
            </div>
            <div className="mt-1.5 font-tele text-xl text-[var(--withdraw)]">
              {withdrawalPct}%
            </div>
            <p className="mt-1 text-[11px] text-neutral-600">
              Likely to drop from the queue
            </p>
          </div>
          <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/[0.05] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[var(--accent-bright)]" />
              <span className="font-tele text-[11px] text-neutral-500">
                Deliverable
              </span>
            </div>
            <div className="mt-1.5 font-tele text-xl text-[var(--accent-bright)]">
              {survivePct}%
            </div>
            <p className="mt-1 text-[11px] text-neutral-600">
              Realistically available power
            </p>
          </div>
        </div>

        <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div
            className="h-full bg-[var(--withdraw)]/50"
            initial={canAnimate ? { width: "0%" } : false}
            animate={{ width: fill ? `${withdrawalPct}%` : "0%" }}
            transition={{ duration: canAnimate ? 1 : 0, ease: EASE, delay: canAnimate ? 0.15 : 0 }}
          />
          <motion.div
            className="h-full bg-[var(--accent)]/60"
            initial={canAnimate ? { width: "0%" } : false}
            animate={{ width: fill ? `${survivePct}%` : "0%" }}
            transition={{ duration: canAnimate ? 1 : 0, ease: EASE, delay: canAnimate ? 0.35 : 0 }}
          />
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-neutral-600">
          Only the deliverable share is power you can actually count on.
        </p>
      </div>
    </Reveal>
  );
}

/* --------------------------------------------------------- How it works */

const STEPS = [
  {
    n: "01",
    t: "Model the queue",
    d: "A survival model is fit on historical interconnection projects — who withdrew, when, and why.",
  },
  {
    n: "02",
    t: "Predict withdrawals",
    d: "Each active project gets a withdrawal probability from its cluster, service type, and technology.",
  },
  {
    n: "03",
    t: "Re-score capacity",
    d: "Published capacity is discounted by expected withdrawals to yield deliverable megawatts per substation.",
  },
];

function HowItWorks() {
  return (
    <section className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal
          as="h2"
          amount={0.5}
          className="max-w-2xl font-display text-[clamp(1.7rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
        >
          From a clogged queue to deliverable megawatts, in three passes.
        </Reveal>

        <RevealGroup
          as="ol"
          stagger={0.14}
          className="relative mt-14 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] md:grid-cols-3"
        >
          {STEPS.map((s) => (
            <motion.li
              key={s.n}
              variants={revealItem}
              className="group relative bg-[#090b0e] p-7 transition-colors hover:bg-[#0c0f14]"
            >
              <div className="flex items-center gap-3">
                <span className="font-tele text-sm text-[var(--accent-bright)]">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[var(--accent)]/40 to-transparent" />
              </div>
              <h3 className="mt-5 font-display text-lg font-medium text-white">
                {s.t}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-400">
                {s.d}
              </p>
            </motion.li>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ The model */

function ModelSection() {
  return (
    <section className="border-b border-white/[0.06]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-32">
        <Reveal amount={0.5}>
          <h2 className="font-display text-[clamp(1.7rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white [text-wrap:balance]">
            A few features separate the projects that get built from the ones
            that vanish.
          </h2>
          <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-neutral-400">
            Hazard ratios above 1 raise the chance a project withdraws. Projects
            tangled in a cluster study are the clearest red flag — the
            queue&apos;s equivalent of a crowd that never moves.
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-6 md:p-7"
        >
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-base font-medium text-white">
              What predicts withdrawal
            </h3>
            <span className="font-tele text-[11px] text-neutral-500">
              hazard ratio
            </span>
          </div>
          <DriversChart drivers={drivers} />
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Stats */

function Stats() {
  const items = [
    {
      value: datasetStats.total,
      decimals: 0,
      label: "Substations",
      sub: `across ${datasetStats.regions} ISO/RTO regions`,
    },
    {
      value: datasetStats.activeProjects,
      decimals: 0,
      label: "Active projects",
      sub: "in the national interconnection queue",
    },
    {
      value: withdrawalPct,
      decimals: 0,
      suffix: "%",
      label: "Withdrawal rate",
      sub: "capacity-weighted, national",
    },
  ];

  return (
    <section className="border-b border-white/[0.06] bg-white/[0.015]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 sm:grid-cols-3 sm:gap-0">
        {items.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 0.1}
            amount={0.6}
            className="sm:px-8 sm:first:pl-0 sm:last:pr-0"
          >
            <div className="font-tele text-[clamp(2.4rem,4vw,3.2rem)] font-medium leading-none tracking-tight text-white">
              <CountUp
                value={s.value}
                decimals={s.decimals}
                suffix={s.suffix ?? ""}
              />
            </div>
            <div className="mt-3 text-sm font-medium text-neutral-200">
              {s.label}
            </div>
            <div className="mt-1 text-xs text-neutral-500">{s.sub}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Final CTA */

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_120%,rgba(61,123,255,0.18),transparent_60%)]" />
      <Reveal
        amount={0.5}
        className="relative mx-auto max-w-3xl px-6 py-28 text-center md:py-36"
      >
        <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white [text-wrap:balance]">
          See which substations still have room.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-neutral-400">
          Explore substations nationwide ranked by capacity that&apos;s
          actually deliverable — not just what the queue claims.
        </p>
        <div className="mt-9 flex justify-center">
          <MagneticCta href="/explorer">Open the explorer</MagneticCta>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------- Footer */

function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-xs text-neutral-600 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2">
          <LogoMark />
          GridSolve · Withdrawal-adjusted interconnection capacity
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/interconnection-queue"
            className="transition-colors hover:text-neutral-300"
          >
            Interconnection queue
          </Link>
          <Link href="/methodology" className="transition-colors hover:text-neutral-300">
            Methodology
          </Link>
          <span className="font-tele">Withdrawal benchmark: LBNL, Queued Up</span>
        </div>
      </div>
    </footer>
  );
}
