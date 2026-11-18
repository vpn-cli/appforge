"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import type { PaperShaderElement } from "@paper-design/shaders";

const MAX_DPR = 1.5;
const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const DRIFT_SPEED = 0.22;
const MESH_TOKENS = ["--mesh-c1", "--mesh-c2", "--mesh-c3", "--mesh-c4"] as const;

type Props = {
  themeKey: string;
  isPaused: boolean;
  onFallback: () => void;
};

type ErrorBoundaryProps = {
  onError: () => void;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ShaderErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function readPaletteFromTokens(): string[] {
  if (typeof window === "undefined") return [];
  const styles = getComputedStyle(document.documentElement);
  return MESH_TOKENS.map((token) => styles.getPropertyValue(token).trim()).filter(Boolean);
}

function computePixelConfig(width: number, height: number): {
  dpr: number;
  maxPixelCount: number;
} {
  const rawDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const dpr = Math.min(Math.max(1, rawDpr), MAX_DPR);
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  return {
    dpr,
    maxPixelCount: Math.max(1, Math.floor(w * h * dpr * dpr)),
  };
}

export function HeroMeshShader({ themeKey, isPaused, onFallback }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shaderElRef = useRef<PaperShaderElement | null>(null);
  const frameMsRef = useRef<number>(0);

  const [colors, setColors] = useState<string[]>(() => readPaletteFromTokens());
  const [pixelConfig, setPixelConfig] = useState<{
    dpr: number;
    maxPixelCount: number;
  } | null>(null);

  // Sync shader colors from CSS custom properties whenever the active theme or <html> class changes
  useEffect(() => {
    const syncColors = () => {
      const next = readPaletteFromTokens();
      if (next.length >= 2) {
        setColors((prev) =>
          prev.length === next.length && prev.every((c, i) => c === next[i]) ? prev : next
        );
      }
    };

    const raf = requestAnimationFrame(syncColors);
    const mo = new MutationObserver(syncColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [themeKey]);

  // Measure actual hero bounds once before mounting WebGL so ShaderMount initializes at exact capped DPR <= 1.5
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updatePixelBudget = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const next = computePixelConfig(rect.width, rect.height);
      setPixelConfig((prev) =>
        prev && prev.dpr === next.dpr && prev.maxPixelCount === next.maxPixelCount ? prev : next
      );
    };

    updatePixelBudget();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(updatePixelBudget);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Listen for WebGL context loss and degrade gracefully to CSS fallback
  useEffect(() => {
    const el = shaderElRef.current;
    if (!el) return;
    const canvas = el.querySelector("canvas");
    if (!canvas) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onFallback();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => canvas.removeEventListener("webglcontextlost", handleContextLost);
  }, [onFallback, pixelConfig]);

  // Drive shader animation at ~30fps only while active (unpaused); 0 rAF when paused
  useEffect(() => {
    if (isPaused || !pixelConfig) return;

    let rafId = 0;
    let lastDrawTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastDrawTime;
      if (elapsed >= FRAME_INTERVAL_MS) {
        lastDrawTime = now - (elapsed % FRAME_INTERVAL_MS);
        frameMsRef.current += Math.min(elapsed, 100) * DRIFT_SPEED;
        shaderElRef.current?.paperShaderMount?.setFrame(frameMsRef.current);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, pixelConfig]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {pixelConfig && colors.length >= 2 && (
        <ShaderErrorBoundary onError={onFallback}>
          <MeshGradient
            ref={shaderElRef}
            colors={colors}
            speed={0}
            frame={frameMsRef.current}
            distortion={0.45}
            swirl={0.18}
            grainMixer={0}
            grainOverlay={0}
            minPixelRatio={pixelConfig.dpr}
            maxPixelCount={pixelConfig.maxPixelCount}
            webGlContextAttributes={{
              powerPreference: "low-power",
              failIfMajorPerformanceCaveat: true,
              antialias: false,
              depth: false,
              stencil: false,
              preserveDrawingBuffer: false,
            }}
            className="w-full h-full block"
          />
        </ShaderErrorBoundary>
      )}
    </div>
  );
}
