"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import type { PaperShaderElement } from "@paper-design/shaders";

const MESH_TOKENS = ["--mesh-c1", "--mesh-c2", "--mesh-c3", "--mesh-c4"] as const;

// Default tuned parameters: calm drifting motion with noticeable changes every 2-3s
export const MESH_PARAMS = {
  distortion: 0.8,
  swirl: 0.5,
  speed: 0.25,
  minPixelRatio: 1,
  maxPixelCount: 1500000,
} as const;

type Props = {
  themeKey: string;
  isPaused: boolean;
  prefersReducedMotion: boolean;
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
  const colors = MESH_TOKENS.map((token) => styles.getPropertyValue(token).trim()).filter(Boolean);
  return colors;
}

export function HeroMeshShader({
  themeKey,
  isPaused,
  prefersReducedMotion,
  onFallback,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shaderElRef = useRef<PaperShaderElement | null>(null);

  const [colors, setColors] = useState<string[]>(() => {
    const initial = readPaletteFromTokens();
    if (initial.length >= 4) return initial;
    // Default fallback tokens if CSS custom properties not yet computed
    return themeKey === "dark"
      ? ["#0B0B12", "#3E2F9A", "#6D5BF0", "#2A3A8A"]
      : ["#F2F1F9", "#CFCBFE", "#ADA6FC", "#C9D8FF"];
  });

  // Sync shader colors from CSS tokens whenever active theme or <html> class toggles.
  // Updates uniforms without remounting the canvas or recompiling the shader program.
  useEffect(() => {
    const syncColors = () => {
      const next = readPaletteFromTokens();
      if (next.length >= 2) {
        setColors((prev) =>
          prev.length === next.length && prev.every((c, i) => c === next[i]) ? prev : next
        );
      }
    };

    syncColors();
    const raf = requestAnimationFrame(syncColors);
    const mo = new MutationObserver(syncColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [themeKey]);

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
  }, [onFallback]);

  // Speed is 0 when paused or when prefers-reduced-motion is requested (rendering static frame)
  const activeSpeed = isPaused || prefersReducedMotion ? 0 : MESH_PARAMS.speed;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <ShaderErrorBoundary onError={onFallback}>
        <MeshGradient
          ref={shaderElRef}
          colors={colors}
          speed={activeSpeed}
          frame={0}
          distortion={MESH_PARAMS.distortion}
          swirl={MESH_PARAMS.swirl}
          grainMixer={0}
          grainOverlay={0}
          minPixelRatio={MESH_PARAMS.minPixelRatio}
          maxPixelCount={MESH_PARAMS.maxPixelCount}
          webGlContextAttributes={{
            powerPreference: "high-performance",
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
          }}
          className="w-full h-full block"
        />
      </ShaderErrorBoundary>
    </div>
  );
}
