"use client";

// The hero's living diagram of Levora's whole thesis: every cell is a queued
// interconnection project. On each loop the field lights up (the queue looks
// full), then ~75% fade out in a staggered wave (withdrawals), leaving only the
// survivors glowing — the capacity that's actually deliverable. Meaning, not
// decoration.
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useCanAnimate } from "./Reveal";

const COLS = 13;
const ROWS = 9;
const SURVIVE_RATE = 0.25; // ~75% withdraw, matching the model's premise
const CYCLE = 7; // seconds per full loop

// Deterministic hash so survivor selection is stable across renders (no SSR
// mismatch) yet looks scattered.
function hash(n: number): number {
  let h = (n + 1) * 2654435761;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return ((h >>> 0) % 1000) / 1000;
}

export default function QueueField() {
  const canAnimate = useCanAnimate();

  const cells = useMemo(
    () =>
      Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const survivor = hash(i) < SURVIVE_RATE;
        // Diagonal wave: cells nearer the top-left withdraw first.
        const wave = (col + row) / (COLS + ROWS);
        return { i, survivor, delay: wave * CYCLE * 0.35 };
      }),
    []
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a0c10]"
      aria-hidden
    >
      {/* faint inner vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_70%_20%,transparent,rgba(0,0,0,0.55))]" />

      <div
        className="absolute inset-0 grid gap-[6px] p-4"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {cells.map(({ i, survivor, delay }) => {
          const color = survivor ? "var(--accent-bright)" : "#dfe6f5";

          if (!canAnimate) {
            // Static end-state: survivors lit, the rest faint.
            return (
              <div
                key={i}
                className="rounded-[3px]"
                style={{
                  backgroundColor: color,
                  opacity: survivor ? 0.95 : 0.1,
                  boxShadow: survivor
                    ? "0 0 10px 0 var(--accent)"
                    : "none",
                }}
              />
            );
          }

          return (
            <motion.div
              key={i}
              className="rounded-[3px] will-change-[opacity]"
              // Static glow on survivors; only opacity animates (cheap,
              // compositor-friendly) so ~120 cells stay smooth.
              style={{
                backgroundColor: color,
                boxShadow: survivor ? "0 0 12px 0 rgba(91,147,255,0.7)" : "none",
              }}
              initial={{ opacity: 0.12 }}
              animate={{
                opacity: survivor
                  ? [0.12, 0.85, 1, 1, 0.95, 0.12]
                  : [0.12, 0.8, 0.75, 0.08, 0.08, 0.12],
              }}
              transition={{
                duration: CYCLE,
                times: [0, 0.14, 0.32, 0.58, 0.8, 1],
                delay,
                repeat: Infinity,
                repeatDelay: 0.4,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* Scanning sheen — reads as live telemetry, killed under reduced-motion. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.06] to-transparent [animation:levora-scan_5.5s_linear_infinite]" />

      {/* Corner readout label */}
      <div className="pointer-events-none absolute bottom-3 left-4 font-tele text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        queue → survivors
      </div>
    </div>
  );
}
