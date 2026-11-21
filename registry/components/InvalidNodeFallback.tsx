import React from "react";
import { AlertTriangle } from "lucide-react";

export interface InvalidNodeFallbackProps {
  type: string;
  issues?: Array<{ path?: string | (string | number)[]; message: string }>;
  rawNode?: unknown;
}

export function InvalidNodeFallback({ type, issues = [], rawNode }: InvalidNodeFallbackProps) {
  return (
    <div className="w-full my-2 p-3.5 rounded-xl border border-warning/30 bg-warning/5 dark:bg-warning/10 text-foreground text-xs font-mono shadow-2xs">
      <div className="flex items-center gap-2 text-warning font-semibold text-[13px] mb-1">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Invalid Component Spec: &lt;{type} /&gt;</span>
      </div>
      <p className="text-[12px] text-muted-foreground font-sans mb-2">
        This component payload did not conform to the schema registry and was replaced with a safe fallback.
      </p>
      {issues.length > 0 && (
        <ul className="space-y-1 pl-4 list-disc text-muted-foreground text-[11px]">
          {issues.map((iss, idx) => {
            const pathStr = iss.path
              ? Array.isArray(iss.path)
                ? iss.path.join(".")
                : String(iss.path)
              : "node";
            return (
              <li key={idx}>
                <span className="font-semibold text-foreground/80">{pathStr}:</span>{" "}
                {iss.message}
              </li>
            );
          })}
        </ul>
      )}
      {process.env.NODE_ENV !== "production" && Boolean(rawNode) && (
        <details className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground cursor-pointer">
          <summary className="font-sans text-[11px] text-muted-foreground hover:text-foreground">
            Inspect raw payload
          </summary>
          <pre className="mt-1 p-2 rounded bg-black/5 dark:bg-white/5 overflow-x-auto text-[10px] select-all">
            {JSON.stringify(rawNode, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
