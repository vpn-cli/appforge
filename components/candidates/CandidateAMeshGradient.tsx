"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import type { PaperShaderElement } from "@paper-design/shaders";

const MAX_DPR = 1.5;
const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const DRIFT_SPEED = 0.35; // ~12s full visual cycle

type Props = {
  isDark?: boolean;
  isPaused?: boolean;
};

type ErrorBoundaryProps = {
  onError: () => void;
  children: ReactNode;
};

class ShaderErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
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

// Candidate A tuned palette:
// Light: ultra-light, low-saturation pastel tints with high base luminance
// Dark: brand-900 / ink-950 depth
const LIGHT_COLORS = ["#F8F9FE", "#E4EBFF", "#EDF2FE", "#FFFFFF"];
const DARK_COLORS = ["#1E1B4B", "#4F46E5", "#2A3A8A", "#0B0B10"];

export function CandidateAMeshGradient({ isDark = false, isPaused = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shaderElRef = useRef<PaperShaderElement | null>(null);
  const frameMsRef = useRef<number>(0);
  const [hasError, setHasError] = useState(false);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const [pixelConfig, setPixelConfig] = useState<{
    dpr: number;
    maxPixelCount: number;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updatePixelBudget = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const rawDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const dpr = Math.min(Math.max(1, rawDpr), MAX_DPR);
      setPixelConfig({
        dpr: 1,
        maxPixelCount: Math.max(1, Math.floor(rect.width * rect.height * dpr * dpr)),
      });
    };

    updatePixelBudget();
    const ro = new ResizeObserver(updatePixelBudget);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (isPaused || !pixelConfig || hasError) return;

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
  }, [isPaused, pixelConfig, hasError]);

  if (hasError) {
    return (
      <div
        className="w-full h-full"
        style={{
          background: isDark
            ? "radial-gradient(circle at 60% 40%, rgba(79, 70, 229, 0.25), transparent 70%)"
            : "radial-gradient(circle at 60% 40%, rgba(143, 180, 255, 0.35), transparent 70%)",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden pointer-events-none opacity-60 dark:opacity-90 transition-opacity"
      style={{
        maskImage:
          "radial-gradient(ellipse 520px 240px at 50% 240px, transparent 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.65) 75%, black 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 520px 240px at 50% 240px, transparent 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.65) 75%, black 100%)",
      }}
    >
      {pixelConfig && (
        <ShaderErrorBoundary onError={() => setHasError(true)}>
          <MeshGradient
            ref={shaderElRef}
            colors={colors}
            speed={0}
            frame={0}
            distortion={0.65} // higher distortion
            swirl={0.4} // higher swirl
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
