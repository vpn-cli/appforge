"use client";

import { Layers } from "lucide-react";
import { RenderNode } from "@/registry";

const previewComponents = [
  {
    type: "Statistic",
    title: "Active Workflows",
    value: "1,244",
    trendValue: "+12%",
    chartWave: true,
    icon: "users",
  },
  {
    type: "DataTable",
    entity: "workflows",
  },
];

export function DemoPreviewCard() {
  return (
    <div className="bg-white/80 dark:bg-[#12131F]/80 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-[0_20px_48px_-12px_rgba(30,27,75,0.08)] flex flex-col justify-between transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          {/* Neutral outline icon tile */}
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
            Rendered Application
          </span>
        </div>

        {/* Live Status Badge (no chevron) */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-medium shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Rendered Application Body (Real Registry Components scoped in dark theme) */}
      <div className="my-3.5 flex flex-col gap-3 min-w-0">
        {previewComponents.map((comp, idx) => (
          <RenderNode key={idx} config={comp} />
        ))}
      </div>

      {/* Footer balance spacer */}
      <div className="pt-2" />
    </div>
  );
}
