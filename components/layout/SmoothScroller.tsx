"use client";

import React, { useEffect } from "react";

const IDLE_STOP_MS = 1200;

export function SmoothScroller({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect reduced motion and use native touch scrolling on coarse-pointer (mobile) devices
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
    if (prefersReducedMotion || isCoarsePointer) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      const lenis = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 1,
      });

      let rafId = 0;
      let lastActivity = 0;

      const stop = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      };

      const raf = (time: number) => {
        lenis.raf(time);
        if (document.hidden || performance.now() - lastActivity > IDLE_STOP_MS) {
          stop();
          return;
        }
        rafId = requestAnimationFrame(raf);
      };

      const wake = () => {
        if (document.hidden) return;
        lastActivity = performance.now();
        if (!rafId) {
          rafId = requestAnimationFrame(raf);
        }
      };

      const handleVisibility = () => {
        if (document.hidden) stop();
      };

      window.addEventListener("wheel", wake, { passive: true });
      window.addEventListener("keydown", wake, { passive: true });
      document.addEventListener("visibilitychange", handleVisibility);

      cleanup = () => {
        stop();
        window.removeEventListener("wheel", wake);
        window.removeEventListener("keydown", wake);
        document.removeEventListener("visibilitychange", handleVisibility);
        lenis.destroy();
      };
    };

    const startTimer = globalThis.setTimeout(init, 250);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(startTimer);
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
