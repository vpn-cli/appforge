"use client";

import { useReducedMotion, motion } from "motion/react";
import {
  Database,
  ShieldAlert,
  Zap,
  Layers,
  Code,
  Activity,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";

export function Features() {
  const shouldReduceMotion = useReducedMotion();
  const easeOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full relative z-10">
      {/* 1. Section Header: 128px above, 48px font, tracking -0.03em */}
      <div className="pt-[128px] pb-16 sm:pb-20 max-w-[1200px] mx-auto px-4 sm:px-6 w-full text-center">
        <motion.h2
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="text-[34px] sm:text-[42px] lg:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-slate-900 dark:text-slate-100 select-none"
        >
          Instant Architecture. Zero Friction.
        </motion.h2>
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.3, delay: 0.06, ease: easeOut }}
          className="text-[17px] sm:text-[18px] text-slate-600 dark:text-slate-400 max-w-[54ch] mx-auto text-center mt-3.5 font-normal leading-[1.6]"
        >
          Deterministic runtime primitives that turn raw JSON metadata into resilient full-stack systems.
        </motion.p>
      </div>

      {/* 2. Three Alternating Feature Rows: 112px between rows, 1200px container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex flex-col gap-[112px] pb-[128px]">

        {/* ============================================================== */}
        {/* Feature 1: Dynamic Backends (Text 5/12 Left, Visual 7/12 Right) */}
        {/* ============================================================== */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 w-full">
          {/* Text Column: 5/12 */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="w-full lg:w-5/12 flex flex-col justify-center"
          >
            {/* 40px Icon Tile in glass-2 with accent tint */}
            <div className="w-10 h-10 rounded-[12px] glass-2 flex items-center justify-center shrink-0 mb-5 text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Database className="w-5 h-5" strokeWidth={1.8} />
            </div>
            {/* Title: 28px weight 600 */}
            <h3 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-slate-900 dark:text-slate-100 mb-3.5">
              Dynamic Backends
            </h3>
            {/* Body: 17px, line-height 1.65, muted, max 46ch */}
            <p className="text-[17px] leading-[1.65] text-slate-600 dark:text-slate-400 max-w-[46ch] font-normal">
              Instantly generated Postgres schemas and REST APIs based purely on your JSON entity definitions. 
              AppForge inspects your frontend components and dynamically binds data endpoints before you even write a single line of backend logic.
            </p>
          </motion.div>

          {/* Visual Column: 7/12 (glass-1, radius 28, inner ~70% fill, glass-3 tiles) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: 0.06, ease: easeOut }}
            className="w-full lg:w-7/12"
          >
            <div className="glass-1 rounded-[28px] p-5 sm:p-10 w-full min-h-[380px] sm:min-h-[420px] flex items-center justify-center relative overflow-hidden select-none">
              {/* Inner content filling ~70% of card */}
              <div className="w-full max-w-[540px] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
                
                {/* Left: Entity rows */}
                <div className="flex flex-col gap-2.5 w-full max-w-[260px] sm:w-[220px] shrink-0">
                  <div className="glass-3 rounded-xl p-2.5 sm:p-3 flex items-center justify-between border border-white/80 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Layers className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div className="text-[12px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                          users
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 font-mono">
                          4 fields · id, role
                        </div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                  </div>

                  <div className="glass-3 rounded-xl p-2.5 sm:p-3 flex items-center justify-between border border-white/80 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Layers className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div className="text-[12px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                          projects
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 font-mono">
                          6 fields · org_id
                        </div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                  </div>

                  <div className="glass-3 rounded-xl p-2.5 sm:p-3 flex items-center justify-between border border-white/80 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Layers className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div className="text-[12px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                          workflows
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 font-mono">
                          3 fields · trigger
                        </div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                  </div>
                </div>

                {/* Center: Animated dashed connector with traveling dot */}
                {/* Horizontal on desktop */}
                <div className="hidden sm:flex flex-1 relative items-center justify-center min-w-[48px] sm:min-w-[72px]">
                  <svg className="w-full h-3 text-indigo-400/60 dark:text-indigo-400/40" viewBox="0 0 80 12" fill="none">
                    <line x1="0" y1="6" x2="80" y2="6" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { x: [-22, 22], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]"
                  />
                </div>

                {/* Vertical on mobile */}
                <div className="sm:hidden flex items-center justify-center h-8 relative">
                  <svg className="h-8 w-3 text-indigo-400/60 dark:text-indigo-400/40" viewBox="0 0 12 32" fill="none">
                    <line x1="6" y1="0" x2="6" y2="32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { y: [-10, 10], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]"
                  />
                </div>

                {/* Right: LIVE DB tile in glass-3 */}
                <div className="glass-3 rounded-2xl p-4 sm:p-6 w-full max-w-[260px] sm:w-[160px] flex flex-row sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center gap-2 border border-white/80 dark:border-white/10 shrink-0">
                  <div className="flex items-center gap-2.5 sm:flex-col">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Database className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.8} />
                    </div>
                    <span className="font-mono text-[12px] font-bold tracking-widest px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                      LIVE DB
                    </span>
                  </div>
                  <div className="sm:mt-1 text-right sm:text-center">
                    <div className="text-[12px] font-mono text-slate-500 dark:text-slate-400">
                      PostgreSQL 16
                    </div>
                    <div className="text-[12px] font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                      &lt; 2ms latency
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>

        {/* ============================================================== */}
        {/* Feature 2: Graceful Degradation (Visual 7/12 Left, Text 5/12 Right) */}
        {/* ============================================================== */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-14 w-full">
          {/* Visual Column: 7/12 (glass-1, radius 28, 2x2 grid, pulse error tile) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="w-full lg:w-7/12"
          >
            <div className="glass-1 rounded-[28px] p-5 sm:p-10 w-full min-h-[380px] sm:min-h-[420px] flex items-center justify-center relative overflow-hidden select-none">
              {/* Inner 2x2 grid filling ~70% of card */}
              <div className="w-full max-w-[480px] grid grid-cols-2 gap-2.5 sm:gap-4">
                
                {/* Tile 1 (Live - Metrics) */}
                <div className="glass-3 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between h-[135px] sm:h-[150px] border border-white/80 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] sm:text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">
                      Active Users
                    </span>
                    <span className="flex items-center gap-1 text-[12px] sm:text-[12px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      LIVE
                    </span>
                  </div>
                  <div>
                    <div className="text-[20px] sm:text-[24px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      12,840
                    </div>
                    <div className="text-[12px] sm:text-[12px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +14% this week
                    </div>
                  </div>
                </div>

                {/* Tile 2 (Error State - Localized boundary with soft red and subtle pulse) */}
                <div className="glass-3 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between h-[135px] sm:h-[150px] border border-rose-500/40 bg-rose-500/[0.04] dark:bg-rose-500/[0.08] relative overflow-hidden animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                      <span className="text-[12px] sm:text-[12px] font-medium text-rose-600 dark:text-rose-400 truncate">
                        Boundary
                      </span>
                    </div>
                    <span className="text-[12px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20 shrink-0">
                      ISOLATED
                    </span>
                  </div>
                  <div>
                    <div className="text-[12px] sm:text-[12px] text-rose-600/90 dark:text-rose-300 font-mono leading-tight">
                      Render caught: Type mismatch at &apos;metrics&apos;
                    </div>
                    <div className="text-[12px] sm:text-[12px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      Page remains interactive
                    </div>
                  </div>
                </div>

                {/* Tile 3 (Live - Data Table) */}
                <div className="glass-3 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between h-[135px] sm:h-[150px] border border-white/80 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] sm:text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">
                      Data Table
                    </span>
                    <span className="flex items-center gap-1 text-[12px] sm:text-[12px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      LIVE
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 sm:h-2 w-full rounded bg-slate-300/60 dark:bg-white/10" />
                    <div className="h-1.5 sm:h-2 w-3/4 rounded bg-slate-300/40 dark:bg-white/5" />
                    <div className="h-1.5 sm:h-2 w-5/6 rounded bg-slate-300/40 dark:bg-white/5" />
                  </div>
                  <div className="text-[12px] sm:text-[12px] font-mono text-slate-500 dark:text-slate-400">
                    3 records rendered
                  </div>
                </div>

                {/* Tile 4 (Live - API Proxy) */}
                <div className="glass-3 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between h-[135px] sm:h-[150px] border border-white/80 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] sm:text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">
                      API Gateway
                    </span>
                    <span className="flex items-center gap-1 text-[12px] sm:text-[12px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      LIVE
                    </span>
                  </div>
                  <div>
                    <div className="text-[12px] sm:text-[12px] font-mono font-medium text-slate-800 dark:text-slate-200">
                      200 OK
                    </div>
                    <div className="text-[12px] sm:text-[12px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      GET /api/proxy · 14ms
                    </div>
                  </div>
                  <div className="text-[12px] sm:text-[12px] font-mono text-slate-500 dark:text-slate-400">
                    Status: operational
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* Text Column: 5/12 */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: 0.06, ease: easeOut }}
            className="w-full lg:w-5/12 flex flex-col justify-center"
          >
            {/* 40px Icon Tile in glass-2 with same accent tint */}
            <div className="w-10 h-10 rounded-[12px] glass-2 flex items-center justify-center shrink-0 mb-5 text-indigo-600 dark:text-indigo-400 shadow-xs">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.8} />
            </div>
            {/* Title: 28px weight 600 */}
            <h3 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-slate-900 dark:text-slate-100 mb-3.5">
              Graceful Degradation
            </h3>
            {/* Body: 17px, line-height 1.65, muted, max 46ch */}
            <p className="text-[17px] leading-[1.65] text-slate-600 dark:text-slate-400 max-w-[46ch] font-normal">
              Broken config? Missing fields? AppForge treats your UI like a microservices architecture. 
              Instead of crashing the page, it isolates the specific rendering error with a localized Error Boundary so your layout remains interactive and functional.
            </p>
          </motion.div>
        </div>

        {/* ============================================================== */}
        {/* Feature 3: Instant Preview (Text 5/12 Left, Visual 7/12 Right)  */}
        {/* ============================================================== */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 w-full">
          {/* Text Column: 5/12 */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="w-full lg:w-5/12 flex flex-col justify-center"
          >
            {/* 40px Icon Tile in glass-2 with same accent tint */}
            <div className="w-10 h-10 rounded-[12px] glass-2 flex items-center justify-center shrink-0 mb-5 text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Zap className="w-5 h-5" strokeWidth={1.8} />
            </div>
            {/* Title: 28px weight 600 */}
            <h3 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-slate-900 dark:text-slate-100 mb-3.5">
              Instant Preview
            </h3>
            {/* Body: 17px, line-height 1.65, muted, max 46ch */}
            <p className="text-[17px] leading-[1.65] text-slate-600 dark:text-slate-400 max-w-[46ch] font-normal">
              Experience unparalleled developer velocity. The side-by-side builder interface monitors your JSON runtime in 
              real-time, immediately validating schema structures and syncing layout mutations to the DOM in under 5ms.
            </p>
          </motion.div>

          {/* Visual Column: 7/12 (JSON card -> arrow -> rendered card filling in on scroll) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: 0.06, ease: easeOut }}
            className="w-full lg:w-7/12"
          >
            <div className="glass-1 rounded-[28px] p-5 sm:p-10 w-full min-h-[380px] sm:min-h-[420px] flex items-center justify-center relative overflow-hidden select-none">
              {/* Inner content filling ~70% of card */}
              <div className="w-full max-w-[540px] flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5">
                
                {/* Left: JSON card */}
                <div className="glass-3 rounded-2xl p-3.5 sm:p-4 w-full max-w-[260px] sm:w-[220px] border border-white/80 dark:border-white/10 font-mono text-[12px] leading-[1.65] select-none shrink-0 shadow-xs">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/50 dark:border-white/5 font-sans">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Code className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[12px] font-medium">app.config</span>
                    </div>
                    <span className="text-[12px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                      &lt;5ms
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400">&#123;</span><br />
                    &nbsp;&nbsp;<span className="text-slate-700 dark:text-slate-300">&quot;type&quot;</span>: <span className="text-indigo-600 dark:text-indigo-300">&quot;Metric&quot;</span>,<br />
                    &nbsp;&nbsp;<span className="text-slate-700 dark:text-slate-300">&quot;title&quot;</span>: <span className="text-indigo-600 dark:text-indigo-300">&quot;Revenue&quot;</span>,<br />
                    &nbsp;&nbsp;<span className="text-slate-700 dark:text-slate-300">&quot;value&quot;</span>: <span className="text-indigo-600 dark:text-indigo-300">&quot;$48.2k&quot;</span><br />
                    <span className="text-indigo-600 dark:text-indigo-400">&#125;</span>
                  </div>
                </div>

                {/* Center: Arrow with subtle motion */}
                <div className="flex items-center justify-center shrink-0">
                  <motion.div
                    animate={shouldReduceMotion ? undefined : { x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="w-8 h-8 rounded-full glass-2 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs"
                  >
                    <ArrowRight className="w-4 h-4 hidden sm:block" />
                    <ArrowDown className="w-4 h-4 sm:hidden" />
                  </motion.div>
                </div>

                {/* Right: Rendered card that fills in on scroll */}
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, ease: easeOut, delay: 0.12 }}
                  className="glass-3 rounded-2xl p-4 sm:p-5 w-full max-w-[260px] sm:w-[230px] border border-white/80 dark:border-white/10 shadow-sm flex flex-col justify-between h-[155px] sm:h-[165px] shrink-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                        Revenue
                      </span>
                    </div>
                    <span className="text-[12px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      +18%
                    </span>
                  </div>

                  <div>
                    <div className="text-[20px] sm:text-[24px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      $48,200
                    </div>
                    <div className="text-[12px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Synced from Postgres
                    </div>
                  </div>

                  <div className="h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 text-[12px] font-medium flex items-center justify-center transition-colors shadow-xs select-none gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Rendered Component</span>
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
