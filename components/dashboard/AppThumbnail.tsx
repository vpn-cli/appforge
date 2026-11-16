"use client";

import React, { Component, ReactNode } from "react";
import { RenderNode } from "@/registry";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ThumbnailErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("[ThumbnailRenderError]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

type Props = {
  config?: unknown;
};

export function AppThumbnail({ config }: Props) {
  let parsedConfig: {
    app?: string;
    pages?: Array<{
      title?: string;
      components?: Array<Record<string, unknown>>;
    }>;
    components?: Array<Record<string, unknown>>;
  } | null = null;

  let parseError = false;

  try {
    if (typeof config === "string") {
      parsedConfig = JSON.parse(config);
    } else if (config && typeof config === "object") {
      parsedConfig = config as unknown as typeof parsedConfig;
    }
  } catch {
    parseError = true;
  }

  const components =
    parsedConfig?.pages?.[0]?.components ||
    (Array.isArray(parsedConfig?.components) ? parsedConfig?.components : []);

  const hasComponents = Array.isArray(components) && components.length > 0;

  // Scoped error state when configuration fails
  const errorFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-error-light/30 border-b border-error-border/40 text-center">
      <div className="w-7 h-7 rounded-full bg-error-light flex items-center justify-center mb-1.5 text-error-text">
        <AlertCircle className="w-4 h-4" />
      </div>
      <span className="text-xs font-mono font-medium text-error-text">
        Scoped render error
      </span>
      <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">
        Component failed in this preview
      </span>
    </div>
  );

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden bg-background/80 border-b border-border/60 select-none pointer-events-none group-hover:border-foreground/30 transition-colors"
      aria-hidden="true"
    >
      {parseError ? (
        errorFallback
      ) : !hasComponents ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-muted/10 text-center">
          <div className="w-8 h-8 rounded border border-dashed border-border/80 flex items-center justify-center text-muted-foreground/40 mb-2">
            <span className="font-mono text-xs">&lt;&gt;</span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground/70">
            Empty application canvas
          </span>
          <span className="text-[10px] text-muted-foreground/40 mt-0.5">
            Add components in builder
          </span>
        </div>
      ) : (
        <ThumbnailErrorBoundary fallback={errorFallback}>
          {/* Scaled desktop viewport container */}
          <div className="absolute top-0 left-0 w-[840px] h-[525px] origin-top-left transform scale-[0.35] sm:scale-[0.38] lg:scale-[0.35] p-6 bg-background flex flex-col gap-4 overflow-hidden pointer-events-none">
            {components.slice(0, 4).map((comp, idx) => (
              <RenderNode key={idx} config={comp} />
            ))}
          </div>
        </ThumbnailErrorBoundary>
      )}

      {/* Subtle top edge glare/vignette to evoke a crisp viewport edge */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 pointer-events-none" />
    </div>
  );
}
