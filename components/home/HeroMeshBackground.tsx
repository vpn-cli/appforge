"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const DynamicHeroMeshShader = dynamic(
  () => import("./HeroMeshShader").then((mod) => mod.HeroMeshShader),
  { ssr: false }
);

function hasWebGL2Api(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.WebGL2RenderingContext !== "undefined";
}

export function HeroMeshBackground() {
  const { resolvedTheme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [shaderEnabled, setShaderEnabled] = useState(false);
  const [shaderFailed, setShaderFailed] = useState(false);
  const [isVisibleInViewport, setIsVisibleInViewport] = useState(true);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Track prefers-reduced-motion live
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Load WebGL shader via dynamic import strictly after first paint and idle
  useEffect(() => {
    if (prefersReducedMotion || shaderFailed) return;

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    let idleId: number | null = null;
    let timerId: number | null = null;

    const activate = () => {
      if (cancelled) return;
      if (hasWebGL2Api()) {
        startTransition(() => setShaderEnabled(true));
      } else {
        setShaderFailed(true);
      }
    };

    const scheduleAfterPaint = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (typeof window.requestIdleCallback === "function") {
            idleId = window.requestIdleCallback(activate, { timeout: 1200 });
          } else {
            timerId = globalThis.setTimeout(activate, 200) as unknown as number;
          }
        });
      });
    };

    if (document.readyState === "complete") {
      scheduleAfterPaint();
    } else {
      window.addEventListener("load", scheduleAfterPaint, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleAfterPaint);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        globalThis.clearTimeout(timerId);
      }
    };
  }, [prefersReducedMotion, shaderFailed]);

  // Pause when document.hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsDocumentHidden(document.hidden);
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Pause when hero leaves viewport (IntersectionObserver)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisibleInViewport(entry.isIntersecting);
      },
      { threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleFallback = useCallback(() => {
    setShaderFailed(true);
    setShaderEnabled(false);
  }, []);

  const shouldRenderShader = shaderEnabled && !shaderFailed && !prefersReducedMotion;
  const isPaused = isDocumentHidden || !isVisibleInViewport || prefersReducedMotion;
  const shaderState = !shouldRenderShader
    ? "fallback"
    : isPaused
      ? "paused"
      : "running";

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      data-testid="hero-mesh-background"
      data-shader-state={shaderState}
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none hero-mesh-mask"
    >
      {/* Immediate static CSS mesh-gradient fallback (first paint, reduced-motion, no-WebGL) */}
      <div className="absolute inset-0 hero-mesh-fallback" />

      {/* Dynamically imported WebGL mesh gradient after first paint */}
      {shouldRenderShader && (
        <div className="absolute inset-0 transition-opacity duration-500 opacity-100">
          <DynamicHeroMeshShader
            themeKey={resolvedTheme || "dark"}
            isPaused={isPaused}
            onFallback={handleFallback}
          />
        </div>
      )}
    </div>
  );
}
