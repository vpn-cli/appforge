"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  const easeOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full text-center pt-6 sm:pt-8 pb-0 px-4 relative z-10 flex flex-col items-center shrink-0">
      {/* Main Headline: "Live Config-" stays solid; only "driven Apps" gets the violet->indigo gradient */}
      <motion.h1
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="text-[38px] sm:text-[48px] lg:text-[64px] font-bold tracking-[-0.035em] leading-[1.04] text-slate-900 dark:text-slate-100 max-w-4xl mx-auto mb-3 sm:mb-4 select-none"
      >
        <span>Live Config-</span>
        <span className="bg-gradient-to-r from-[#5B21B6] via-[#4338CA] to-[#3730A3] dark:from-[#A78BFA] dark:via-[#818CF8] dark:to-[#6366F1] bg-clip-text text-transparent">
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

      {/* CTAs:
          - Primary: near-black with faint violet glow underneath (dark: near-white with dark label)
          - Secondary: reusable glass-2 material (no parent transform stacking context leak) */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.14, ease: easeOut }}
        className="flex items-center justify-center gap-3.5 select-none mb-7 sm:mb-8"
      >
        <Link
          href="/builder/demo"
          className="group h-11 px-6 rounded-xl bg-[#0A0A12] hover:bg-[#1A1A24] text-white shadow-[0_4px_20px_rgba(99,102,241,0.22)] dark:bg-[#F8FAFC] dark:hover:bg-white dark:text-[#0A0A12] dark:shadow-[0_4px_20px_rgba(255,255,255,0.12)] font-medium text-[15px] inline-flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Start Building</span>
          <ArrowRight
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </Link>

        <Link
          href="/templates"
          className="h-11 px-6 rounded-xl glass-2 text-slate-800 dark:text-slate-100 font-medium text-[15px] inline-flex items-center transition-all active:scale-[0.98]"
        >
          <span>View Templates</span>
        </Link>
      </motion.div>
    </section>
  );
}
