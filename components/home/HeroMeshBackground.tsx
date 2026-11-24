"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const DynamicNativeMeshShader = dynamic(
  () => import("./NativeMeshShader").then((mod) => mod.NativeMeshShader),
  { ssr: false }
);

function hasWebGLApi(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.WebGL2RenderingContext !== "undefined" ||
    typeof window.WebGLRenderingContext !== "undefined"
  );
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

  const forceCss =
    process.env.NEXT_PUBLIC_FORCE_CSS_FALLBACK === "true" ||
    (typeof window !== "undefined" &&
      ((window as any).__FORCE_CSS_FALLBACK === true ||
        window.location.search.includes("fallback=css")));

  // Track prefers-reduced-motion live
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Track mobile vs desktop viewport/input capability: Mobile gets pure CSS radial-gradient
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateDeviceType = () => {
      setIsMobile(isMobileEnvironment());
    };
    updateDeviceType();
    // Preload dynamic chunk during idle so module evaluation never blocks input
    if (!isMobileEnvironment() && !forceCss) {
      import("./NativeMeshShader").catch(() => {});
    }
    window.addEventListener("resize", updateDeviceType, { passive: true });
    return () => window.removeEventListener("resize", updateDeviceType);
  }, [forceCss]);

  // Desktop guardrail: Mount WebGL strictly after first paint via requestIdleCallback
  // Mobile guardrail: Zero WebGL (stays on static CSS fallback)
  useEffect(() => {
    if (shaderFailed || isMobile || forceCss) {
      if ((isMobile || forceCss) && shaderEnabled) {
        setShaderEnabled(false);
      }
      return;
    }

    let cancelled = false;
    let idleId: number | null = null;
    let timerId: number | null = null;

    const activate = () => {
      if (cancelled) return;
      if (isMobileEnvironment() || forceCss) return;
      if (hasWebGLApi()) {
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
  }, [shaderFailed, isMobile, shaderEnabled, forceCss]);

  // Pause when document is hidden (tab switch or minimized)
  useEffect(() => {
    const handleVisibility = () => {
      setIsDocumentHidden(document.hidden);
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Pause when hero is off-screen (IntersectionObserver)
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

  // Desktop mounts WebGL; on mobile or failure, stays on CSS fallback.
  // When prefers-reduced-motion is true on desktop, shader runs with speed 0 (static frame).
  const shouldRenderShader = shaderEnabled && !shaderFailed && !isMobile && !forceCss;
  const isPaused = isDocumentHidden || !isVisibleInViewport;
  const shaderState = !shouldRenderShader
    ? "fallback"
    : isPaused
      ? "paused"
      : prefersReducedMotion
        ? "reduced-motion"
        : "running";

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      data-testid="hero-mesh-background"
      data-shader-state={shaderState}
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none hero-mesh-mask"
    >
      {/* Immediate static CSS radial-gradient version in the same palette (mobile, first paint, fallback) */}
      <div className="absolute inset-0 hero-mesh-fallback" />

      {/* Desktop WebGL NativeMeshShader mounted asynchronously without remounting on theme switch */}
      {shouldRenderShader && (
        <div className="absolute inset-0 transition-opacity duration-700 opacity-90 dark:opacity-95">
          <DynamicNativeMeshShader
            themeKey={resolvedTheme || "dark"}
            isPaused={isPaused}
            prefersReducedMotion={prefersReducedMotion}
            onFallback={handleFallback}
          />
        </div>
      )}
    </div>
  );
}
