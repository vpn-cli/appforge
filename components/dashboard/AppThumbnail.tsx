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

  // Fallback realistic layout when app has empty config, so card is never half-empty
  const fallbackComponents = [
    {
      type: "Header",
      title: parsedConfig?.app || "Workspace Operations",
      subtitle: "Active telemetry, connected records, and alerts.",
      size: "md",
    },
    {
      type: "Grid",
      columns: 2,
      gap: 3,
      items: [
        { type: "Statistic", label: "Throughput", value: "99.8%", trend: "up", trendValue: "+0.4%" },
        { type: "Statistic", label: "Active Jobs", value: "18", trend: "up", trendValue: "+2" },
      ],
    },
    {
      type: "DataTable",
      entity: "records",
      columns: [
        { key: "name", label: "Resource", type: "text" },
        { key: "status", label: "Status", type: "badge" },
      ],
      data: [
        { id: "1", name: "Primary Node Alpha", status: "Healthy" },
        { id: "2", name: "Worker Group Beta", status: "Active" },
      ],
    },
  ];

  const renderList = hasComponents ? components.slice(0, 3) : fallbackComponents;

  // Scoped error state when configuration fails
  const errorFallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-error-light/30 border-b border-error-border/40 text-center">
      <div className="w-7 h-7 rounded-full bg-error-light flex items-center justify-center mb-1.5 text-error-text">
        <AlertCircle className="w-4 h-4" />
      </div>
      <span className="text-xs font-mono font-medium text-error-text">
        Scoped render error
      </span>
      <span className="text-[12px] text-muted-foreground mt-0.5 max-w-[200px] truncate">
        Component failed in this preview
      </span>
    </div>
  );

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden bg-card/60 dark:bg-white/[0.02] border-b border-border/60 dark:border-white/5 select-none pointer-events-none group-hover:border-foreground/30 transition-colors"
      aria-hidden="true"
      inert
    >
      {/* Scaled desktop viewport container with bottom fade mask */}
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 50%, rgba(0,0,0,0.85) 75%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 50%, rgba(0,0,0,0.85) 75%, transparent 100%)",
        }}
      >
        {parseError ? (
          errorFallback
        ) : (
          <ThumbnailErrorBoundary fallback={errorFallback}>
            {/* Cropped to top-left at larger scale (0.75x) ensuring all text >= 9px effective */}
            <div className="absolute top-0 left-0 w-[540px] origin-top-left transform scale-[0.75] sm:scale-[0.78] p-4 bg-background flex flex-col gap-3 overflow-hidden pointer-events-none">
              {renderList.map((comp, idx) => (
                <RenderNode key={idx} config={comp} />
              ))}
            </div>
          </ThumbnailErrorBoundary>
        )}
      </div>

      {/* Subtle top edge glare/vignette to evoke a crisp viewport edge */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 pointer-events-none" />
    </div>
  );
}
