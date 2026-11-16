"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

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
  const hasIssues = errors.length > 0 || warnings.length > 0;
  // Automatically expand if issues exist, collapse if 0 issues
  const [isExpanded, setIsExpanded] = useState(hasIssues);

  useEffect(() => {
    if (hasIssues) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [hasIssues]);

  // When collapsed: single 28px (h-7) status-bar row with "No issues"
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full h-7 border-t border-border bg-card hover:bg-muted/50 px-3 flex items-center justify-between transition-colors text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 select-none cursor-pointer"
        aria-label="Expand validation log"
      >
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 text-brand animate-spin" />
              <span className="text-[11px] text-brand font-medium">
                Validating layout...
              </span>
            </>
          ) : hasIssues ? (
            <>
              <AlertCircle className="w-3 h-3 text-error-text" />
              <span className="text-[11px] text-error-text font-medium">
                {errors.length} error{errors.length === 1 ? "" : "s"}
                {warnings.length > 0 ? `, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : ""}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-success-text" />
              <span className="text-[11px] text-success-text font-medium">
                No issues
              </span>
            </>
          )}
        </div>
        <div className="flex items-center text-muted-foreground">
          <ChevronUp className="w-3.5 h-3.5" />
        </div>
      </button>
    );
  }

  return (
    <div className="w-full h-44 bg-card flex flex-col border-t border-border overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => setIsExpanded(false)}
        className="h-7 border-b border-border flex items-center px-3 justify-between bg-muted/40 hover:bg-muted/70 transition-colors shrink-0 cursor-pointer select-none"
        aria-label="Collapse validation log"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            Validation log
          </span>
          {!isGenerating && (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-error-text">
                <AlertCircle className="w-3 h-3" />
                {errors.length}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-warning-text">
                <AlertCircle className="w-3 h-3" />
                {warnings.length}
              </span>
            </div>
          )}
        </div>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        data-lenis-prevent
        aria-live="polite"
      >
        {isGenerating ? (
          <div className="flex items-center text-brand text-xs font-medium gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            AI actively rendering. Validation suspended...
          </div>
        ) : (
          <>
            {!hasIssues && (
              <div className="flex items-center text-success-text text-xs font-medium gap-2 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No issues. Config is structurally valid.
              </div>
            )}
            {errors.map((err, i) => (
              <div
                key={`err-${i}`}
                className="text-error-text text-xs font-mono bg-error-light p-2 rounded border border-error-border leading-relaxed break-all"
              >
                <span className="font-bold mr-1 uppercase text-[10px]">[ERR]</span>{" "}
                {err}
              </div>
            ))}
            {warnings.map((warn, i) => (
              <div
                key={`warn-${i}`}
                className="text-warning-text text-xs font-mono bg-warning-light p-2 rounded border border-warning-border leading-relaxed break-all"
              >
                <span className="font-bold mr-1 uppercase text-[10px]">[WARN]</span>{" "}
                {warn}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
