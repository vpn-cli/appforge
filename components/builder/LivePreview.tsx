"use client";

import { useState, useEffect } from "react";
import { RenderNode } from "@/registry";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "motion/react";
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
  const [realOrigin, setRealOrigin] = useState("localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.host) {
      setRealOrigin(window.location.host);
    }
  }, []);

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
      className="w-full h-full bg-background p-3 sm:p-5 flex flex-col items-center justify-start overflow-y-auto select-none"
      data-lenis-prevent
    >
      {/* Framed Browser Viewport Container: hugs content height */}
      <div
        className={`${viewportWidthClass} flex flex-col bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 ease-out shadow-xs shrink-0 max-h-full`}
      >
        {/* Browser Window Chrome Toolbar */}
        {showInnerToolbar && (
          <div className="h-9 px-3.5 bg-muted/40 border-b border-border flex items-center justify-between shrink-0 select-none">
            {/* Window Monochrome Dots */}
            <div className="flex items-center gap-1.5 w-16">
              <span className="w-2.5 h-2.5 rounded-full bg-border hover:bg-muted-foreground/60 transition-colors" />
              <span className="w-2.5 h-2.5 rounded-full bg-border hover:bg-muted-foreground/60 transition-colors" />
              <span className="w-2.5 h-2.5 rounded-full bg-border hover:bg-muted-foreground/60 transition-colors" />
            </div>

            {/* Address Bar Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-background border border-border rounded-md text-[13px] text-muted-foreground font-mono max-w-[280px] w-full justify-center">
              <Lock className="w-3 h-3 text-muted-foreground/70" />
              <span className="truncate">{realOrigin}/apps/{appId}</span>
            </div>

            {/* End spacer balancing traffic lights */}
            <div className="w-16" />
          </div>
        )}

        {/* Viewport Content Area: hugs content with exact spacing */}
        <div
          className="@container overflow-y-auto p-4 @sm:p-6 bg-card min-w-0"
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
                className="text-warning-text text-[13px] flex flex-col gap-2 items-center justify-center font-mono p-6 bg-warning-light border border-warning-border rounded-lg max-w-sm mx-auto text-center"
              >
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">
                  Malformed JSON config
                  {errorPosition.line
                    ? ` (line ${errorPosition.line}, col ${errorPosition.column})`
                    : ""}
                </span>
                <span className="text-[13px] text-muted-foreground font-sans">
                  Fix syntax errors in the left code editor to restore live preview.
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                {(() => {
                  const items = config?.pages?.[0]?.components || [];
                  if (items.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-20 border border-dashed border-border rounded-xl bg-muted/10 text-center">
                        <span className="text-lg mb-2 opacity-50">📭</span>
                        <span className="text-sm">
                          No components defined in configuration yet
                        </span>
                      </div>
                    );
                  }

                  return items.map((comp: Record<string, unknown>, i: number) => {
                    const nextComp = items[i + 1] as Record<string, unknown> | undefined;
                    // Spacing: header → stats 24px, stats → table 20px, default 20px
                    let marginClass = "";
                    if (nextComp) {
                      const curType = comp?.type;
                      const nextType = nextComp?.type;
                      if (curType === "Header" && nextType === "Grid") {
                        marginClass = "mb-6"; // 24px
                      } else if (curType === "Grid" && nextType === "DataTable") {
                        marginClass = "mb-5"; // 20px
                      } else if (curType === "Header") {
                        marginClass = "mb-6"; // 24px
                      } else {
                        marginClass = "mb-5"; // 20px
                      }
                    }

                    return (
                      <div key={i} className={`min-w-0 ${marginClass}`}>
                        <RenderNode config={comp} />
                      </div>
                    );
                  });
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
