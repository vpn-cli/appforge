"use client";

import { useEffect, useRef, useState } from "react";
import { DemoCodeCard } from "./DemoCodeCard";
import { DemoPreviewCard } from "./DemoPreviewCard";
import {
  computeScriptedHeroState,
  INITIAL_HERO_STATE,
  type HeroScriptedState,
} from "./heroDemoConfig";

export function DemoRow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<HeroScriptedState>(INITIAL_HERO_STATE);
  const [chartWidth, setChartWidth] = useState(380);
  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(true);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Equal heights: Measure row/code-card height and calculate chart width to maintain 540:696 ratio
  useEffect(() => {
    if (!leftColRef.current || typeof ResizeObserver === "undefined") return;

    const computeWidthFromHeight = (h: number, colW: number) => {
      const isDesktop = window.innerWidth >= 1024;
      if (!isDesktop) {
        const mobileW = Math.max(240, Math.min(340, colW - 40));
        setChartWidth(mobileW);
        return;
      }
      // Available height inside preview card: total height minus header(44) + footer(36) + padding(40) + py-3(24) = 144px
      const availH = Math.max(320, h - 144);
      // Fixed 540:696 card ratio (HN = 696 / 540 = 1.28888...)
      const targetW = Math.floor((availH * 540) / 696);
      const maxColW = Math.max(260, colW - 40);
      setChartWidth(Math.min(maxColW, targetW));
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height, width } = entry.contentRect;
        if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = setTimeout(() => {
          computeWidthFromHeight(height, width);
        }, 150);
      }
    });

    ro.observe(leftColRef.current);

    // Initial measurement
    const rect = leftColRef.current.getBoundingClientRect();
    if (rect.height > 0) {
      computeWidthFromHeight(rect.height, rect.width);
    }

    return () => {
      ro.disconnect();
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined" && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isVisibleRef.current = entry.isIntersecting;
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    }

    let accumulatedTime = 0;
    let lastTimestamp: number | null = null;
    let rafId: number;

    const tick = (now: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = now;
      }
      const delta = now - lastTimestamp;
      lastTimestamp = now;

      if (isVisibleRef.current && !isHoveredRef.current) {
        accumulatedTime += delta;
        const nextState = computeScriptedHeroState(accumulatedTime);
        setState((prev) => {
          if (
            prev.phase === nextState.phase &&
            prev.periodValue === nextState.periodValue &&
            prev.displayPeriodString === nextState.displayPeriodString &&
            prev.validationStatus === nextState.validationStatus &&
            prev.activeLineHighlighted === nextState.activeLineHighlighted &&
            prev.showCursor === nextState.showCursor
          ) {
            return prev;
          }
          return nextState;
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    const startTimer = setTimeout(() => {
      accumulatedTime = 2800;
      lastTimestamp = performance.now();
      rafId = requestAnimationFrame(tick);
    }, 2800);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(rafId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div ref={leftColRef} className="min-w-0 h-full flex flex-col">
          <DemoCodeCard
            periodDisplay={state.displayPeriodString}
            validationStatus={state.validationStatus}
            activeLineHighlighted={state.activeLineHighlighted}
            showCursor={state.showCursor}
          />
        </div>
        <div className="min-w-0 h-full flex flex-col">
          <DemoPreviewCard period={state.periodValue} width={chartWidth} />
        </div>
      </div>
    </div>
  );
}

export default DemoRow;
