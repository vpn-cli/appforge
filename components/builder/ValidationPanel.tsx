"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type ValidationPanelProps = {
  errors: string[];
  warnings: string[];
  isGenerating?: boolean;
};

export function ValidationPanel({
  errors,
  warnings,
  isGenerating,
}: ValidationPanelProps) {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  // Auto-opens on errors; otherwise starts collapsed
  const [isExpanded, setIsExpanded] = useState(hasErrors);

  useEffect(() => {
    if (hasErrors) {
      setIsExpanded(true);
    }
  }, [hasErrors]);

  // Collapsed: 32px (h-8) status bar at the bottom of the editor pane
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full h-8 border-t border-border/80 bg-card hover:bg-muted/50 px-3 flex items-center justify-between transition-colors text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 select-none cursor-pointer"
        aria-label="Expand validation log"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
              <span className="text-[12px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                Validating layout...
              </span>
            </>
          ) : hasErrors ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-error-text shrink-0" />
              <span className="text-[12px] text-error-text font-medium truncate">
                {errors.length} error{errors.length === 1 ? "" : "s"}
                {hasWarnings ? `, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : ""}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="text-[12px] font-medium tracking-tight">
                ✓ No issues
              </span>
              {hasWarnings && (
                <span className="text-[11px] text-warning-text ml-1.5 font-normal">
                  ({warnings.length} warning{warnings.length === 1 ? "" : "s"})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center text-muted-foreground shrink-0 pl-2">
          <ChevronUp className="w-3.5 h-3.5" />
        </div>
      </button>
    );
  }

  // Expanded upward: 32px header status bar + scrollable issues list
  return (
    <div className="w-full h-44 bg-card flex flex-col border-t border-border overflow-hidden shrink-0 transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(false)}
        className="h-8 border-b border-border/80 flex items-center px-3 justify-between bg-muted/40 hover:bg-muted/70 transition-colors shrink-0 cursor-pointer select-none"
        aria-label="Collapse validation log"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-medium text-muted-foreground">
            Validation log
          </span>
          {!isGenerating && (
            <div className="flex items-center gap-2.5">
              {hasErrors ? (
                <span className="flex items-center gap-1 text-[12px] font-mono font-medium text-error-text">
                  <AlertCircle className="w-3 h-3" />
                  {errors.length} {errors.length === 1 ? "error" : "errors"}
                </span>
              ) : (
                <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ No issues
                </span>
              )}
              {hasWarnings && (
                <span className="flex items-center gap-1 text-[12px] font-mono font-medium text-warning-text">
                  <AlertCircle className="w-3 h-3" />
                  {warnings.length}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>

      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        data-lenis-prevent
        aria-live="polite"
      >
        {isGenerating ? (
          <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-xs font-medium gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            AI actively rendering. Validation suspended...
          </div>
        ) : (
          <>
            {!hasErrors && !hasWarnings && (
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium gap-2 py-1">
                <span>✓ Config is structurally valid.</span>
              </div>
            )}
            {errors.map((err, i) => (
              <div
                key={`err-${i}`}
                className="text-error-text text-xs font-mono bg-error-light p-2 rounded border border-error-border leading-relaxed break-all"
              >
                <span className="font-bold mr-1 uppercase text-[12px]">[ERR]</span>{" "}
                {err}
              </div>
            ))}
            {warnings.map((warn, i) => (
              <div
                key={`warn-${i}`}
                className="text-warning-text text-xs font-mono bg-warning-light p-2 rounded border border-warning-border leading-relaxed break-all"
              >
                <span className="font-bold mr-1 uppercase text-[12px]">[WARN]</span>{" "}
                {warn}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
