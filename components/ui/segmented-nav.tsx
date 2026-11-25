"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavSegment {
  label: string;
  href?: string;
  value?: string;
}

export interface SegmentedNavProps {
  segments: NavSegment[];
  activeValue?: string;
  onSelect?: (value: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedNav({
  segments,
  activeValue,
  onSelect,
  className,
  size = "md",
}: SegmentedNavProps) {
  const isSm = size === "sm";

  return (
    <nav
      aria-label="Segmented Navigation"
      className={cn(
        "inline-flex items-center p-1 rounded-full bg-slate-200/50 dark:bg-white/5 border border-border select-none",
        className
      )}
    >
      {segments.map((seg) => {
        const key = seg.value || seg.href || seg.label;
        const isActive = activeValue ? activeValue === key || activeValue === seg.href : false;

        const itemClasses = cn(
          "rounded-full font-medium transition-all duration-200 flex items-center justify-center whitespace-nowrap outline-none",
          isSm ? "px-3 py-1 text-[13px]" : "px-4 py-1.5 text-[15px]",
          isActive
            ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.08)] dark:bg-white/[0.12] dark:text-white dark:shadow-none"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        );

        if (seg.href) {
          return (
            <Link key={key} href={seg.href} className={itemClasses}>
              {seg.label}
            </Link>
          );
        }

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect?.(key)}
            className={itemClasses}
          >
            {seg.label}
          </button>
        );
      })}
    </nav>
  );
}

