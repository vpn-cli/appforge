"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  const easeOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full text-center pt-6 sm:pt-8 pb-0 px-4 relative z-10 flex flex-col items-center shrink-0">
      {/* Main Headline: "Live Config-" stays near-black; only "driven Apps" gets the violet->indigo gradient */}
      <motion.h1
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="text-[38px] sm:text-[48px] lg:text-[64px] font-bold tracking-[-0.035em] leading-[1.04] text-slate-900 dark:text-slate-100 max-w-4xl mx-auto mb-3 sm:mb-4 select-none"
      >
        <span>Live Config-</span>
        <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 dark:from-violet-400 dark:via-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
          driven Apps
        </span>
      </motion.h1>

      {/* Subhead: Centered, muted, 17-18px, line-height 1.6, max 60ch */}
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: easeOut }}
        className="text-[17px] sm:text-[18px] text-slate-600 dark:text-slate-400 leading-[1.6] max-w-[60ch] mx-auto mb-6 sm:mb-7 font-normal"
      >
        Write a single JSON configuration describing your data and UI. AppForge
        instantly renders a working application, complete with a database, dynamic
        APIs, and zero boilerplate.
      </motion.p>

      {/* CTAs: Primary is solid near-black with nudging arrow; Secondary is frosted ghost button with no play icon */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14, ease: easeOut }}
        className="flex items-center justify-center gap-3.5 select-none mb-7 sm:mb-8"
      >
        <Link
          href="/builder/demo"
          className="group h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-medium text-[15px] inline-flex items-center gap-2 shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition-all active:scale-[0.98]"
        >
          <span>Start Building</span>
          <ArrowRight
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </Link>

        <Link
          href="/templates"
          className="h-11 px-6 rounded-xl bg-white/70 hover:bg-white/90 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-200 border border-slate-300/50 dark:border-white/15 font-medium text-[15px] inline-flex items-center backdrop-blur-md shadow-xs transition-all active:scale-[0.98]"
        >
          <span>View Templates</span>
        </Link>
      </motion.div>
    </section>
  );
}
