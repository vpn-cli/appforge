"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  const easeOut = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="w-full text-center pt-[80px] pb-0 px-4 relative z-10 flex flex-col items-center shrink-0">
      {/* Main Headline: "Live Config-" stays solid; only "driven Apps" gets the brighter violet->indigo gradient */}
      <motion.h1
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="text-[38px] sm:text-[48px] lg:text-[64px] font-bold tracking-[-0.035em] leading-[1.04] text-slate-900 dark:text-slate-100 max-w-4xl mx-auto mb-[20px] select-none"
      >
        <span>Live Config-</span>
        <span className="bg-gradient-to-r from-[#7C5CFF] to-[#4F6BFF] dark:from-[#9D8CFF] dark:to-[#6B85FF] bg-clip-text text-transparent">
          driven Apps
        </span>
      </motion.h1>

      {/* Subhead: Centered, muted, 17-18px, line-height 1.6, max 60ch */}
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: easeOut }}
        className="text-[17px] sm:text-[18px] text-slate-600 dark:text-slate-400 leading-[1.6] max-w-[60ch] mx-auto mb-[36px] font-normal"
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
        className="flex items-center justify-center gap-3.5 select-none mb-[64px]"
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
