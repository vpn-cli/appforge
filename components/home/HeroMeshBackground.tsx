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

function isMobileEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const isNarrow =
    window.innerWidth < 768 || (window.matchMedia?.("(max-width: 767px)")?.matches ?? false);
  return isCoarse || isNarrow;
}

export function HeroMeshBackground() {
  const { resolvedTheme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [shaderEnabled, setShaderEnabled] = useState(false);
  const [shaderFailed, setShaderFailed] = useState(false);
  const [isVisibleInViewport, setIsVisibleInViewport] = useState(true);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Track prefers-reduced-motion live
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Track mobile vs desktop viewport/input capability: CSS gradient ONLY on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateDeviceType = () => {
      setIsMobile(isMobileEnvironment());
    };
    updateDeviceType();
    window.addEventListener("resize", updateDeviceType, { passive: true });
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  // On desktop: WebGL compiles strictly in requestIdleCallback without any interaction triggers.
  // On mobile: CSS gradient only (shader never enabled).
  useEffect(() => {
    if (prefersReducedMotion || shaderFailed || isMobile) {
      if (isMobile && shaderEnabled) {
        setShaderEnabled(false);
      }
      return;
    }

    let cancelled = false;
    let idleId: number | null = null;
    let timerId: number | null = null;

    const activate = () => {
      if (cancelled) return;
      if (isMobileEnvironment()) return;
      if (hasWebGL2Api()) {
        startTransition(() => setShaderEnabled(true));
      } else {
        setShaderFailed(true);
      }
    };

    const scheduleDesktopIdleCompile = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(activate, { timeout: 2000 });
      } else {
        timerId = window.setTimeout(activate, 500);
      }
    };

    if (document.readyState === "complete") {
      scheduleDesktopIdleCompile();
    } else {
      window.addEventListener("load", scheduleDesktopIdleCompile, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleDesktopIdleCompile);
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [prefersReducedMotion, shaderFailed, isMobile, shaderEnabled]);

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

  const shouldRenderShader = shaderEnabled && !shaderFailed && !prefersReducedMotion && !isMobile;
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
      {/* Immediate static CSS mesh-gradient fallback (mobile, first paint, reduced-motion, no-WebGL) */}
      <div className="absolute inset-0 hero-mesh-fallback" />

      {/* Dynamically imported WebGL mesh gradient compiled in requestIdleCallback on desktop */}
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
