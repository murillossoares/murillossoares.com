"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ScoreboardData } from "@/models/metrics";

export default function Scoreboard3DFallback({ data }: { data: ScoreboardData }) {
  const reduced = useReducedMotion();
  const bars = useMemo(() => [
    { c: "bg-green-500", b: "border-green-500/50", metric: data.uptime },
    { c: "bg-blue-500", b: "border-blue-500/50", metric: data.stackDepth },
    { c: "bg-purple-500", b: "border-purple-500/50", metric: data.architecture },
    { c: "bg-orange-500", b: "border-orange-500/50", metric: data.projects },
  ], [data]);
  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6 flex flex-col justify-end relative">
      <div className="flex items-end justify-center gap-4 md:gap-8 h-full relative z-10 pb-4">
        {bars.map((bar, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
            <motion.div initial={reduced ? { height: `${bar.metric.percent}%` } : { height: "0%" }} animate={{ height: `${bar.metric.percent}%` }}
              transition={reduced ? {} : { duration: 0.8, delay: i * 0.15 }} className={`w-full ${bar.c} ${bar.b} border-2 rounded-t-md min-h-[40px] relative`}>
              <div className="absolute top-2 left-0 right-0 text-center text-xs font-mono font-bold text-white">{bar.metric.percent}%</div>
            </motion.div>
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase">{bar.metric.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
