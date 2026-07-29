"use client";

// Counts from 0 to `value` when scrolled into view. Respects reduced motion by
// rendering the final value immediately.
import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCanAnimate } from "./Reveal";

export default function CountUp({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 1.4,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const canAnimate = useCanAnimate();
  const [display, setDisplay] = useState(0);
  const [fallback, setFallback] = useState(false);

  // Blank-proof: land on the final value even if the observer never fires.
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), 1100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // No animation possible (hidden tab / reduced motion): show final value.
    if (!canAnimate) {
      setDisplay(value);
      return;
    }
    if (!inView && !fallback) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // ease-out-expo
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, fallback, canAnimate, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
