"use client";

import { Layers } from "lucide-react";
import { RenderNode } from "@/registry";

const previewComponents = [
  {
    type: "Statistic",
    title: "Active Workflows",
    value: "1,244",
    format: "full",
    trendValue: "+12%",
    chartWave: true,
    icon: "users",
    variant: "panel",
  },
  {
    type: "DataTable",
    entity: "workflows",
    variant: "dark-panel",
    rows: [
      { workflow: "User Sync", trigger: "cron:hourly", status: "Running" },
      { workflow: "Invoice Gen", trigger: "webhook:rx", status: "Idle" },
    ],
  },
];

export function DemoPreviewCard() {
  return (
    <div className="bg-white/80 dark:bg-[#12131F]/80 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl p-5 shadow-[0_20px_48px_-12px_rgba(30,27,75,0.08)] flex flex-col justify-between transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Indigo icon tile */}
          <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
            Rendered Application
          </span>
        </div>

        {/* Live Status Badge: Chevron removed per prompt */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-medium shadow-xs select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Rendered Application Body (Real Registry Components scoped in dark theme) */}
      <div className="dark mt-4 flex flex-col gap-4 min-w-0 flex-1 justify-between">
        {previewComponents.map((comp, idx) => (
          <RenderNode key={idx} config={comp} />
        ))}
      </div>
    </div>
  );
}
