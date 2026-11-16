"use client";

import { useState } from "react";
import { RenderNode } from "@/registry";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Tablet, Smartphone, Lock, RotateCcw } from "lucide-react";

function PreviewSkeleton() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-4xl mx-auto flex flex-col gap-6 p-6 w-full"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-3/4 max-w-[360px] rounded-lg bg-card" />
        <Skeleton className="h-5 w-1/2 max-w-[480px] rounded-md bg-card/60" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[180px] rounded-lg w-full bg-card shadow-sm" />
        <Skeleton className="h-[180px] rounded-lg w-full bg-card shadow-sm" />
        <Skeleton className="h-[180px] rounded-lg w-full bg-card shadow-sm" />
      </div>
      <Skeleton className="h-[260px] rounded-xl w-full mt-2 bg-card" />
    </motion.div>
  );
}

function extractJsonParsePosition(
  err: unknown,
  raw: string,
): { line?: number; column?: number } {
  if (!(err instanceof Error)) return {};
  const msg = err.message;
  const lineColMatch = msg.match(/line\s+(\d+).*?column\s+(\d+)/i);
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }
  const posMatch = msg.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    if (!isNaN(pos) && pos >= 0 && pos <= raw.length) {
      const lines = raw.slice(0, pos).split("\n");
      return { line: lines.length, column: lines[lines.length - 1].length + 1 };
    }
  }
  return {};
}

type ViewportMode = "desktop" | "tablet" | "mobile";

export function LivePreview({
  configStr,
  appId = "demo",
  viewport,
  onViewportChange,
  showInnerToolbar = true,
}: {
  configStr: string;
  appId?: string;
  viewport?: ViewportMode;
  onViewportChange?: (mode: ViewportMode) => void;
  showInnerToolbar?: boolean;
}) {
  const [localViewport, setLocalViewport] = useState<ViewportMode>("desktop");
  const currentViewport = viewport ?? localViewport;
  const handleViewport = onViewportChange ?? setLocalViewport;

  let config;
  let parseError = false;
  let errorPosition: { line?: number; column?: number } = {};
  const isStreaming = configStr.includes('"<<<REPLACE>>>"');

  try {
    if (!isStreaming) {
      config = JSON.parse(configStr);
    }
  } catch (err: unknown) {
    parseError = true;
    errorPosition = extractJsonParsePosition(err, configStr);
  }

  const viewportWidthClass = {
    desktop: "w-full max-w-full",
    tablet: "w-[768px] max-w-full",
    mobile: "w-[375px] max-w-full",
  }[currentViewport];

  return (
    <div
      className="w-full h-full bg-background p-3 sm:p-5 flex flex-col items-center justify-start overflow-hidden select-none"
      data-lenis-prevent
    >
      {/* Framed Browser Viewport Container */}
      <div
        className={`${viewportWidthClass} h-full flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-300 ease-out`}
      >
        {/* Browser Window Chrome Toolbar */}
        {showInnerToolbar && (
          <div className="h-9 px-3.5 bg-muted/30 border-b border-border flex items-center justify-between shrink-0 select-none">
            {/* Window Traffic Lights */}
            <div className="flex items-center gap-1.5 w-16">
              <span className="w-2.5 h-2.5 rounded-full bg-border hover:bg-red-500/80 transition-colors" />
              <span className="w-2.5 h-2.5 rounded-full bg-border hover:bg-amber-500/80 transition-colors" />
              <span className="w-2.5 h-2.5 rounded-full bg-border hover:bg-emerald-500/80 transition-colors" />
            </div>

            {/* Address Bar Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-background/80 border border-border/80 rounded-md text-[11px] text-muted-foreground font-mono max-w-[280px] w-full justify-center">
              <Lock className="w-2.5 h-2.5 text-muted-foreground/70" />
              <span className="truncate">localhost:3000/apps/{appId}</span>
            </div>

            {/* Viewport Toggles */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleViewport("desktop")}
                className={`p-1 rounded transition-colors ${
                  currentViewport === "desktop"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Desktop (100%)"
                aria-label="Desktop viewport"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleViewport("tablet")}
                className={`p-1 rounded transition-colors ${
                  currentViewport === "tablet"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tablet (768px)"
                aria-label="Tablet viewport"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleViewport("mobile")}
                className={`p-1 rounded transition-colors ${
                  currentViewport === "mobile"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Mobile (375px)"
                aria-label="Mobile viewport"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Viewport Content Area: Fills frame height */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 bg-card"
          data-lenis-prevent
        >
          <AnimatePresence mode="wait">
            {isStreaming ? (
              <PreviewSkeleton />
            ) : parseError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-warning-text text-xs flex flex-col gap-2 items-center justify-center h-full font-mono p-6 bg-warning-light/20 border border-warning-border/50 rounded-lg max-w-sm mx-auto text-center"
              >
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">
                  Malformed JSON config
                  {errorPosition.line
                    ? ` (line ${errorPosition.line}, col ${errorPosition.column})`
                    : ""}
                </span>
                <span className="text-[11px] text-muted-foreground font-sans">
                  Fix syntax errors in the left code editor to restore live preview.
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                {config?.pages?.[0]?.components?.map(
                  (comp: Record<string, unknown>, i: number) => (
                    <RenderNode key={i} config={comp} />
                  ),
                ) || (
                  <div className="flex flex-col items-center justify-center text-muted-foreground py-20 border border-dashed border-border rounded-xl bg-muted/10 text-center">
                    <span className="text-lg mb-2 opacity-50">📭</span>
                    <span className="text-xs">
                      No components defined in configuration yet
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
