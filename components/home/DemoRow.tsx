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
  const [state, setState] = useState<HeroScriptedState>(INITIAL_HERO_STATE);
  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    // Check prefers-reduced-motion: if reduced motion is preferred, remain static
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

      // Only advance time if in viewport and not hovered
      if (isVisibleRef.current && !isHoveredRef.current) {
        accumulatedTime += delta;
        const nextState = computeScriptedHeroState(accumulatedTime);
        setState((prev) => {
          // Avoid unnecessary state updates if values are identical
          if (
            prev.phase === nextState.phase &&
            prev.variantValue === nextState.variantValue &&
            prev.displayVariantString === nextState.displayVariantString &&
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

    rafId = requestAnimationFrame(tick);

    return () => {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="min-w-0">
          <DemoCodeCard
            variantDisplay={state.displayVariantString}
            validationStatus={state.validationStatus}
            activeLineHighlighted={state.activeLineHighlighted}
            showCursor={state.showCursor}
          />
        </div>
        <div className="min-w-0">
          <DemoPreviewCard variant={state.variantValue} />
        </div>
      </div>
    </div>
  );
}
