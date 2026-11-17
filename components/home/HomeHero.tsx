"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  const easeOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full text-center pt-[28px] pb-0 px-4 relative z-10 flex flex-col items-center shrink-0">
      {/* Main Headline: "Live Config-" stays solid; only "driven Apps" gets the brighter violet->indigo gradient */}
      <motion.h1
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="text-[36px] sm:text-[46px] lg:text-[58px] font-bold tracking-[-0.035em] leading-[1.05] text-slate-900 dark:text-slate-100 max-w-4xl mx-auto mb-[14px] select-none"
      >
        <span>Live Config-</span>
        <span className="bg-gradient-to-r from-[#7C5CFF] to-[#4F6BFF] dark:from-[#9D8CFF] dark:to-[#6B85FF] bg-clip-text text-transparent">
          driven Apps
        </span>
      </motion.h1>

      {/* Subhead: Centered, muted, 16-17px, line-height 1.55, max 58ch */}
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: easeOut }}
        className="text-[16px] sm:text-[17px] text-slate-600 dark:text-slate-400 leading-[1.55] max-w-[58ch] mx-auto mb-[22px] font-normal"
      >
        Write a single JSON configuration describing your data and UI. AppForge
        instantly renders a working application, complete with a database, dynamic
        APIs, and zero boilerplate.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.14, ease: easeOut }}
        className="flex items-center justify-center gap-3.5 select-none mb-[28px]"
      >
        <Button
          render={<Link href="/builder/demo" />}
          variant="primary"
          size="lg"
          showArrow
        >
          <span>Start Building</span>
        </Button>

        <Button
          render={<Link href="/templates" />}
          variant="secondary"
          size="lg"
        >
          <span>View Templates</span>
        </Button>
      </motion.div>
    </section>
  );
}
