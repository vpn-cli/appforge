"use client";

import { Layers, MoreHorizontal, Users, FileText, ArrowUpRight, BarChart3 } from "lucide-react";
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
    iconBg: "bg-indigo-600/10 dark:bg-indigo-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    trigger: "cron:hourly",
    status: "Running",
  },
  {
    id: "2",
    name: "Invoice Gen",
    icon: FileText,
    iconBg: "bg-violet-600/10 dark:bg-violet-500/20",
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
      className="glass-1 rounded-[24px] p-5 sm:p-6 flex flex-col justify-between h-full transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/60 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Icon tile */}
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
            <Layers className="w-4 h-4" strokeWidth={2} />
          </div>
          {/* Small caps label */}
          <span className="text-[12px] font-bold tracking-wider uppercase text-slate-900 dark:text-slate-100 font-sans">
            Rendered Application
          </span>
        </div>

        {/* Live pill whose green dot pulses gently */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-2-nested text-[12px] font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-500/20 dark:bg-emerald-950/70 border-emerald-500/40 shadow-2xs select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Content Body: Metric Card + Floating Rows Table */}
      <div className="my-5 flex flex-col gap-5 flex-1 justify-center min-w-0">
        {/* Metric Card: Desaturated translucent periwinkle gradient (#8B93E8 -> #B9B4F0 at 85% opacity),
            large soft wave shape inside, chart icon in a glass circle on the right, tabular-nums white, soft green glass delta chip */}
        <div className="rounded-2xl bg-gradient-to-r from-[#8B93E8]/90 via-[#9BA3EC]/85 to-[#B9B4F0]/85 dark:from-[#4338CA]/50 dark:via-[#4F46E5]/40 dark:to-[#7C3AED]/35 border border-white/70 dark:border-white/15 text-white p-5 relative overflow-hidden shadow-[0_8px_24px_-4px_rgba(139,147,232,0.30)] dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5)] select-none">
          {/* Large soft flowing wave shape inside */}
          <div
            className="absolute -right-6 -bottom-4 w-[280px] h-[120px] pointer-events-none opacity-40 dark:opacity-25"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 280 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="softWaveGrad" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0 90 C 60 70, 110 30, 170 45 C 220 58, 250 20, 280 10 L 280 120 L 0 120 Z"
                fill="url(#softWaveGrad)"
              />
              <path
                d="M0 90 C 60 70, 110 30, 170 45 C 220 58, 250 20, 280 10"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-white/90">
                Active Workflows
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-[36px] sm:text-[40px] font-bold font-sans tracking-tight tabular-nums text-white leading-none">
                  1,244
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 dark:text-emerald-200 text-[12px] font-medium leading-none shadow-2xs">
                  <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
                  <span>+12%</span>
                </span>
              </div>
            </div>

            {/* Chart icon in a glass circle on the right */}
            <div className="w-11 h-11 rounded-full bg-white/20 dark:bg-white/10 border border-white/40 dark:border-white/20 flex items-center justify-center text-white shadow-2xs shrink-0">
              <BarChart3 className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Table: NO bordered container. Header labels sit outside in small caps.
            Each row is its own rounded floating glass-3 row with ~56px height, 16-17px text, 40px icon tiles */}
        <div className="flex flex-col">
          {/* Header labels outside the rows in small caps */}
          <div className="grid grid-cols-[1.5fr_1.2fr_1fr_28px] items-center px-4 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300 select-none mb-1.5">
            <span>Workflow</span>
            <span>Trigger</span>
            <span>Status</span>
            <span />
          </div>

          {/* Floating rows stack with small gap */}
          <div className="flex flex-col gap-2.5">
            {TABLE_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.id}
                  className="group grid grid-cols-[1.5fr_1.2fr_1fr_28px] items-center px-4 h-[56px] rounded-2xl glass-3 hover:scale-[1.005] transition-all"
                >
                  {/* Workflow: 40px circle icon tile + 16px row title */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-10 h-10 rounded-full glass-3-tile ${row.iconColor} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <span className="text-[16px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {row.name}
                    </span>
                  </div>

                  {/* Trigger: mono trigger text */}
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-[13px] font-medium text-slate-700 dark:text-slate-300">
                      {row.trigger}
                    </span>
                  </div>

                  {/* Status pill with dot */}
                  <div>
                    {row.status === "Running" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/15 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Running</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-indigo-500/15 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200 border border-indigo-500/40 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>Idle</span>
                      </span>
                    )}
                  </div>

                  {/* Row kebab that appears on hover */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Row actions"
                    >
                      <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
