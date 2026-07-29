"use client";

// Horizontal bar chart of withdrawal-driver hazard ratios. Bars grow in when the
// chart scrolls into view (and show full immediately if it never does / reduced
// motion, so it never ships blank).
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useCanAnimate } from "./Reveal";
import type { Driver } from "@/lib/data";

const ACCENT = "#3d7bff";

export default function DriversChart({ drivers }: { drivers: Driver[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  // Only animate when animation can actually run (visible tab, motion allowed).
  // Otherwise recharts' paused animation leaves the bars unrendered — so we draw
  // them statically at full width instead.
  const canAnimate = useCanAnimate();
  const animate = canAnimate && inView;

  // Sort strongest-first so the most predictive driver sits on top.
  const rows = [...drivers].sort((a, b) => b.hazard_ratio - a.hazard_ratio);
  const max = Math.max(...rows.map((d) => d.hazard_ratio), 1);

  return (
    <div ref={ref} className="w-full">
      <div className="mt-6 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            // Remount when it enters view so recharts replays the grow-in.
            key={animate ? "in" : "idle"}
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 52, bottom: 4, left: 8 }}
            barCategoryGap={16}
          >
            <XAxis type="number" domain={[0, Math.ceil(max * 1.15)]} hide />
            <YAxis
              type="category"
              dataKey="feature"
              width={158}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#c2c6cf", fontSize: 12.5 }}
            />
            {/* Baseline: hazard ratio of 1 means "no effect". */}
            <ReferenceLine
              x={1}
              stroke="#3a3d44"
              strokeDasharray="3 4"
              label={{
                value: "1.0 · no effect",
                position: "top",
                fill: "#6b7280",
                fontSize: 10,
              }}
            />
            <Bar
              dataKey="hazard_ratio"
              radius={[0, 5, 5, 0]}
              isAnimationActive={animate}
              animationDuration={950}
              animationEasing="ease-out"
            >
              {rows.map((d) => (
                <Cell key={d.feature} fill={ACCENT} />
              ))}
              <LabelList
                dataKey="hazard_ratio"
                position="right"
                formatter={(v: number) => `${v.toFixed(2)}×`}
                fill="#eaecf1"
                fontSize={12.5}
                className="font-tele"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
