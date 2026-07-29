"use client";

// Scroll-reveal that NEVER ships blank. Content animates in when it enters view,
// but also has a mount-time fallback timer — so if the IntersectionObserver never
// fires (hidden tab, headless renderer, unusual scroll), the content still
// appears. Reduced motion shows it instantly. The reveal enhances an
// already-guaranteed-visible default rather than gating visibility on it.
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Whether entrance/scroll animations should run at all. False when the user
// prefers reduced motion OR the document starts hidden (background tab, headless
// renderer) — because framer-motion's rAF loop is paused there, so any element
// gated on an animation would stay stuck at its `initial` state and ship blank.
// When false, callers render content at its final visible state immediately.
export function useCanAnimate(): boolean {
  const reduce = useReducedMotion();
  const [can, setCan] = useState(false);

  useEffect(() => {
    if (reduce) {
      setCan(false);
      return;
    }
    if (typeof document === "undefined" || !document.hidden) {
      setCan(true);
      return;
    }
    // Started hidden: wait until the tab is shown before animating.
    const onVis = () => {
      if (!document.hidden) setCan(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reduce]);

  return can;
}

// Stable, module-level motion components. Computing `motion[as]` inside render
// returns a fresh component type each pass, which remounts the element every
// render and resets its state (breaking the fallback timer). Map once here.
const TAGS = {
  div: motion.div,
  li: motion.li,
  h2: motion.h2,
  p: motion.p,
  ol: motion.ol,
  ul: motion.ul,
} as const;

export function Reveal({
  children,
  delay = 0,
  y = 24,
  amount = 0.3,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  amount?: number;
  className?: string;
  as?: "div" | "li" | "h2" | "p";
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const canAnimate = useCanAnimate();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFallback(true), 1100);
    return () => clearTimeout(t);
  }, []);

  // When we can't animate, show immediately with no initial hidden state.
  const show = !canAnimate || inView || fallback;
  const MotionTag = TAGS[as];

  return (
    <MotionTag
      ref={ref as never}
      initial={canAnimate ? { opacity: 0, y } : false}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

// Staggered group: parent orchestrates children, with the same blank-proof
// fallback. Children use RevealChildVariants.
export function RevealGroup({
  children,
  stagger = 0.1,
  amount = 0.3,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  stagger?: number;
  amount?: number;
  className?: string;
  as?: "div" | "ol" | "ul";
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const canAnimate = useCanAnimate();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFallback(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const show = !canAnimate || inView || fallback;
  const MotionTag = TAGS[as];

  return (
    <MotionTag
      ref={ref as never}
      initial={canAnimate ? "hidden" : "show"}
      animate={show ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: canAnimate ? stagger : 0 } },
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
