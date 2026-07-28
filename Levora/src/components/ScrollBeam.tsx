"use client";

// A vertical accent gradient that fills downward as the page scrolls — a
// progress "spine" running down the left gutter. The filled portion tracks
// scroll progress (spring-smoothed) with a glowing leading edge, so the gradient
// animates downward and reveals as you scroll. Reduced motion gets a static hint.
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

export default function ScrollBeam() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    mass: 0.4,
  });
  const height = useTransform(
    smooth,
    (v) => `${Math.min(1, Math.max(0, v)) * 100}%`
  );

  return (
    <div className="pointer-events-none fixed left-4 top-0 z-30 h-screen w-px sm:left-8">
      {/* faint full-height track */}
      <div className="absolute inset-0 bg-white/[0.05]" />

      {reduce ? (
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[var(--accent)] to-transparent opacity-50" />
      ) : (
        <motion.div
          style={{ height }}
          className="relative w-full bg-gradient-to-b from-[var(--accent-bright)] via-[var(--accent)] to-transparent"
        >
          {/* soft glow around the beam */}
          <span className="absolute inset-0 bg-gradient-to-b from-[var(--accent-bright)] to-transparent opacity-70 blur-[3px]" />
          {/* leading edge */}
          <span className="absolute -bottom-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--accent-bright)] shadow-[0_0_10px_2px_var(--accent)]" />
        </motion.div>
      )}
    </div>
  );
}
