"use client";

import Link from "next/link";
import { PlayCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function HomeHero() {
  return (
    <section className="w-full text-center pt-12 pb-8 px-4 relative z-10 flex flex-col items-center">
      {/* Eyebrow Pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EDEBFB] dark:bg-indigo-950/40 border border-[#DDD8F8] dark:border-indigo-800/40 text-[13px] font-medium text-[#4F46E5] dark:text-[#818CF8] shadow-sm mb-5 select-none"
      >
        <span>Config-driven · Prompt to runtime</span>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="text-4xl sm:text-5xl lg:text-[60px] font-bold tracking-[-0.03em] leading-[1.14] text-[#09090B] dark:text-[#F8FAFC] max-w-4xl mx-auto mb-5"
      >
        Live Config-
        <span className="bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#2563EB] dark:from-[#818CF8] dark:via-[#6366F1] dark:to-[#3B82F6] bg-clip-text text-transparent">
          driven Apps
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="text-[17px] sm:text-[19px] text-[#475569] dark:text-[#94A3B8] leading-[1.55] max-w-[800px] mx-auto mb-8 font-normal"
      >
        Write a single JSON configuration describing your data and UI. AppForge
        instantly renders a working application, complete with a database, dynamic
        APIs, and zero boilerplate.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="flex items-center justify-center gap-4 flex-wrap select-none"
      >
        <Link
          href="/builder/demo"
          className="h-12 px-6 rounded-lg bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] hover:bg-[#1E1E24] dark:hover:bg-slate-100 font-medium text-sm inline-flex items-center gap-2 shadow-[0_2px_8px_-1px_rgba(30,27,75,0.12)] transition-all active:scale-[0.98]"
        >
          <span>Start Building</span>
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </Link>

        <Link
          href="/templates"
          className="h-12 px-6 rounded-lg bg-white/85 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 font-medium text-sm inline-flex items-center gap-2 shadow-[0_2px_8px_-1px_rgba(30,27,75,0.06)] transition-all active:scale-[0.98]"
        >
          <PlayCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={1.75} />
          <span>View Templates</span>
        </Link>
      </motion.div>
    </section>
  );
}
