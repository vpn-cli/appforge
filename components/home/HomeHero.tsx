"use client";

import Link from "next/link";
import { PlayCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function HomeHero() {
  return (
    <section className="w-full text-center pt-[72px] pb-0 px-4 relative z-10 flex flex-col items-center shrink-0">
      {/* Eyebrow Pill: 14px, no sparkle icon */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EDEBFB] dark:bg-indigo-950/40 border border-[#DDD8F8] dark:border-indigo-800/40 text-[14px] font-medium text-[#4F46E5] dark:text-[#818CF8] shadow-xs mb-5 select-none"
      >
        <span>Config-driven · Prompt to runtime</span>
      </motion.div>

      {/* Main Headline: 64px bold */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
        className="text-4xl sm:text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.1] text-[#09090B] dark:text-[#F8FAFC] max-w-4xl mx-auto mb-6"
      >
        Live{" "}
        <span className="bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#3B82F6] dark:from-[#818CF8] dark:via-[#6366F1] dark:to-[#3B82F6] bg-clip-text text-transparent">
          Config-driven
        </span>{" "}
        <span className="text-[#3B82F6] dark:text-[#60A5FA]">Apps</span>
      </motion.h1>

      {/* Subtitle: 20px, line-height 1.55, max-width 820px */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="text-lg sm:text-[20px] text-[#475569] dark:text-[#94A3B8] leading-[1.55] max-w-[820px] mx-auto mb-8 font-normal"
      >
        Write a single JSON configuration describing your data and UI. AppForge
        instantly renders a working application, complete with a database, dynamic
        APIs, and zero boilerplate.
      </motion.p>

      {/* CTA Buttons: 48px tall, 16px text; 56px gap to the demo row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="flex items-center justify-center gap-4 select-none mb-[56px]"
      >
        <Link
          href="/builder/demo"
          className="h-[48px] px-8 rounded-full bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] hover:bg-[#1E1E24] dark:hover:bg-slate-100 font-medium text-[16px] inline-flex items-center gap-2 shadow-[0_4px_14px_-2px_rgba(30,27,75,0.15)] transition-all active:scale-[0.98]"
        >
          <span>Start Building</span>
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </Link>

        <Link
          href="/templates"
          className="h-[48px] px-8 rounded-full bg-white/90 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 font-medium text-[16px] inline-flex items-center gap-2 shadow-[0_4px_14px_-2px_rgba(30,27,75,0.08)] transition-all active:scale-[0.98]"
        >
          <PlayCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={2} />
          <span>View Templates</span>
        </Link>
      </motion.div>
    </section>
  );
}
