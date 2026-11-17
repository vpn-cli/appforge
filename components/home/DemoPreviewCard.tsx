"use client";

import { Layers, MoreHorizontal, Users, FileText, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface TableRowData {
  id: string;
  name: string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  trigger: string;
  status: "Running" | "Idle";
}

const TABLE_ROWS: TableRowData[] = [
  {
    id: "1",
    name: "User Sync",
    icon: Users,
    iconBg: "bg-indigo-100/80 dark:bg-indigo-950/60",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    trigger: "cron:hourly",
    status: "Running",
  },
  {
    id: "2",
    name: "Invoice Gen",
    icon: FileText,
    iconBg: "bg-violet-100/80 dark:bg-violet-950/60",
    iconColor: "text-violet-600 dark:text-violet-400",
    trigger: "webhook:tx",
    status: "Idle",
  },
];

export function DemoPreviewCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: shouldReduceMotion ? 0 : 0.28,
        ease: "easeOut",
      }}
      className="bg-white/75 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[20px] p-5 sm:p-6 shadow-[0_2px_6px_-1px_rgba(15,23,42,0.04),0_20px_48px_-12px_rgba(99,102,241,0.08)] flex flex-col justify-between h-full transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Icon tile */}
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
          {/* Small caps label */}
          <span className="text-[12px] font-semibold tracking-wider uppercase text-slate-700 dark:text-slate-300 font-sans">
            Rendered Application
          </span>
        </div>

        {/* Live pill whose green dot pulses gently */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 text-[12px] font-medium text-emerald-700 dark:text-emerald-400 shadow-xs select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Content Body: Metric Card + Table */}
      <div className="my-4 flex flex-col gap-4 flex-1 justify-between min-w-0">
        {/* Metric Card: soft indigo->lavender gradient, white text, large tabular-nums 1,244, +12% delta chip, faint sparkline */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 text-white p-4 sm:p-5 relative overflow-hidden shadow-sm select-none">
          {/* Faint elegant sparkline wave in top-right (no overlapping icon) */}
          <div
            className="absolute top-0 right-0 w-[160px] h-[75px] pointer-events-none opacity-40"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 160 75"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="75" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0 65 Q 40 50, 70 55 T 120 30 T 160 15 L 160 75 L 0 75 Z"
                fill="url(#sparklineGrad)"
              />
              <path
                d="M0 65 Q 40 50, 70 55 T 120 30 T 160 15"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-white/90">
              Active Workflows
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] sm:text-[38px] font-bold font-sans tracking-tight tabular-nums text-white leading-none">
                1,244
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[12px] font-medium leading-none">
                <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
                <span>+12%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Table: small-caps header, light rows with 1px dividers, Lucide icons in tinted circles, mono trigger, status pills with dots, row kebab on hover */}
        <div className="rounded-xl border border-slate-200/70 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm shadow-xs">
          {/* Small-caps header */}
          <div className="grid grid-cols-[1.5fr_1.2fr_1fr_28px] items-center px-4 py-2.5 bg-slate-50/80 dark:bg-white/[0.04] border-b border-slate-200/60 dark:border-white/5 text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 select-none">
            <span>Workflow</span>
            <span>Trigger</span>
            <span>Status</span>
            <span />
          </div>

          {/* Rows with 1px dividers */}
          <div className="divide-y divide-slate-200/60 dark:divide-white/5">
            {TABLE_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.id}
                  className="group grid grid-cols-[1.5fr_1.2fr_1fr_28px] items-center px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Workflow: icon in tinted circle + name */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={`w-7 h-7 rounded-full ${row.iconBg} ${row.iconColor} flex items-center justify-center shrink-0 border border-indigo-200/40 dark:border-indigo-800/30`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    </div>
                    <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">
                      {row.name}
                    </span>
                  </div>

                  {/* Trigger: mono trigger text */}
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-[12px] text-slate-500 dark:text-slate-400">
                      {row.trigger}
                    </span>
                  </div>

                  {/* Status pill with dot */}
                  <div>
                    {row.status === "Running" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Running</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>Idle</span>
                      </span>
                    )}
                  </div>

                  {/* Row kebab that appears on hover */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Row actions"
                    >
                      <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quiet footer matching code panel height balance */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 select-none shrink-0">
        <span className="text-[12px] text-slate-500 dark:text-slate-400">Auto-synced</span>
        <span className="font-mono text-[11px] text-slate-400">2 entities</span>
      </div>
    </motion.div>
  );
}
