"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAppRuntimeContext } from "../context";

export interface ColumnSchema {
  key: string;
  label?: string;
  type?: "text" | "number" | "currency" | "id" | "code" | "badge" | "avatar";
  align?: "left" | "right" | "center";
}

export type DataTableColumn = string | ColumnSchema;

export interface DataTableProps {
  columns?: DataTableColumn[];
  data?: Record<string, unknown>[];
  rows?: Record<string, unknown>[];
  entity?: string;
  variant?: "default" | "dark-panel";
  state?: "loading" | "loaded" | "empty" | "error" | "degraded";
  errorMessage?: string;
  degradedMessage?: string;
  isInteractive?: boolean;
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
  className?: string;
}

export function DataTable({
  columns = [],
  data = [],
  rows,
  entity,
  variant = "default",
  state = "loaded",
  errorMessage = "Unable to fetch live dataset. Verify entity connection.",
  degradedMessage = "Showing cached dataset · Live connection paused",
  isInteractive = false,
  onRowClick,
  className = "",
}: DataTableProps) {
  const { appId } = useAppRuntimeContext();
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isTableFocused, setIsTableFocused] = useState<boolean>(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const initialData = (rows && rows.length > 0) ? rows : (data && data.length > 0) ? data : undefined;
  const fetchKey = appId && entity && !initialData ? `${appId}:${entity}` : null;
  const [remoteResult, setRemoteResult] = useState<{
    key: string;
    status: "loaded" | "error";
    rows: Record<string, unknown>[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!appId || !entity || initialData || !fetchKey) return;

    let cancelled = false;
    const targetKey = fetchKey;

    fetch(`/api/proxy/${encodeURIComponent(appId)}/${encodeURIComponent(entity)}`)
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          const msg =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : `Request failed with status ${res.status}`;
          throw new Error(msg);
        }
        return res.json();
      })
      .then((fetched: unknown) => {
        if (cancelled) return;
        setRemoteResult({
          key: targetKey,
          status: "loaded",
          rows: Array.isArray(fetched) ? (fetched as Record<string, unknown>[]) : [],
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRemoteResult({
          key: targetKey,
          status: "error",
          rows: [],
          error: err instanceof Error ? err.message : undefined,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [appId, entity, initialData, fetchKey]);

  const activeRemote = fetchKey && remoteResult?.key === fetchKey ? remoteResult : null;

  const resolvedCols = columns.length > 0 
    ? columns 
    : entity === "workflows"
    ? [
        { key: "workflow", label: "WORKFLOW", type: "avatar" as const },
        { key: "trigger", label: "TRIGGER", type: "code" as const },
        { key: "status", label: "STATUS", type: "badge" as const },
      ]
    : [];

  const resolvedData = initialData
    ? initialData
    : fetchKey
    ? activeRemote?.rows ?? []
    : entity === "workflows"
    ? [
        { workflow: "User Sync", trigger: "cron:hourly", status: "Running" },
        { workflow: "Invoice Gen", trigger: "webhook:rx", status: "Idle" },
      ]
    : [];

  // Normalize column definitions
  const normalizedCols: ColumnSchema[] = (resolvedCols.length > 0
    ? resolvedCols
    : resolvedData.length > 0
    ? Object.keys(resolvedData[0])
    : ["id", "name", "value", "status"]
  ).map((col) => {
    if (typeof col === "string") {
      const lower = col.toLowerCase();
      let type: ColumnSchema["type"] = "text";
      if (lower === "id" || lower.endsWith("_id")) {
        type = "id";
      } else if (lower.includes("price") || lower.includes("cost") || lower.includes("$")) {
        type = "currency";
      } else if (
        lower.includes("amount") ||
        lower.includes("total") ||
        lower.includes("revenue") ||
        lower.includes("count") ||
        lower.includes("quantity") ||
        lower.includes("latency")
      ) {
        type = "number";
      } else if (lower.includes("status") || lower.includes("badge") || lower.includes("state")) {
        type = "badge";
      } else if (lower === "workflow" || lower.includes("avatar") || lower.includes("user")) {
        type = "avatar";
      }
      return {
        key: col,
        label: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " "),
        type,
        align: type === "number" || type === "currency" ? "right" : "left",
      };
    }
    return {
      key: col.key,
      label: col.label || col.key.charAt(0).toUpperCase() + col.key.slice(1).replace(/_/g, " "),
      type: col.type || "text",
      align: col.align || (col.type === "number" || col.type === "currency" ? "right" : "left"),
    };
  });

  // Effective state determination
  const effectiveState =
    state !== "loaded"
      ? state
      : fetchKey && !activeRemote
      ? "loading"
      : activeRemote?.status === "error"
      ? "error"
      : !resolvedData || resolvedData.length === 0
      ? "empty"
      : "loaded";

  const effectiveErrorMessage = activeRemote?.error || errorMessage;

  // Single tab stop keyboard navigation for interactive tables
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive || resolvedData.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(resolvedData.length - 1, prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onRowClick && resolvedData[focusedIndex]) {
        onRowClick(resolvedData[focusedIndex], focusedIndex);
      }
    }
  };

  const getCellValue = (row: Record<string, unknown>, colKey: string): unknown => {
    if (row[colKey] !== undefined) return row[colKey];
    const lowerKey = colKey.toLowerCase();
    if (row[lowerKey] !== undefined) return row[lowerKey];
    for (const [k, v] of Object.entries(row)) {
      if (k.toLowerCase() === lowerKey) return v;
    }
    return undefined;
  };

  const renderCellContent = (col: ColumnSchema, value: unknown, rowIdx: number) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground/50 select-none">-</span>;
    }

    if (col.type === "number" || col.type === "currency") {
      return (
        <span className="font-sans tabular-nums text-foreground">
          {typeof value === "number" ? value.toLocaleString() : String(value)}
        </span>
      );
    }

    if (col.type === "id" || col.type === "code") {
      return (
        <span className={`font-mono ${variant === "dark-panel" ? "text-xs text-slate-400" : "text-[11px] text-muted-foreground"} select-all`}>
          {String(value)}
        </span>
      );
    }

    if (col.type === "avatar") {
      const name = String(value);
      const initials =
        name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || name.slice(0, 2).toUpperCase();

      const avatarStyle = variant === "dark-panel"
        ? rowIdx === 0
          ? "bg-slate-200 text-slate-800 font-bold"
          : "bg-indigo-600 text-white font-bold"
        : "bg-muted text-foreground border border-border";

      return (
        <div className="flex items-center gap-2.5">
          <div className={`${variant === "dark-panel" ? "w-6 h-6 text-[10px]" : "w-5 h-5 text-[9px]"} rounded-full flex items-center justify-center select-none shrink-0 ${avatarStyle}`}>
            {initials}
          </div>
          <span className={`font-sans truncate max-w-[200px] ${variant === "dark-panel" ? "text-[15px] font-medium text-slate-100" : "text-xs font-medium text-foreground"}`} title={name}>
            {name}
          </span>
        </div>
      );
    }

    if (col.type === "badge") {
      const valStr = String(value).toLowerCase();
      const isRunning = valStr.includes("running");
      const isIdle = valStr.includes("idle");

      if (isRunning) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {String(value)}
          </span>
        );
      }

      if (isIdle) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            {String(value)}
          </span>
        );
      }

      let colorClass = "bg-muted text-muted-foreground border-border";
      if (
        valStr.includes("active") ||
        valStr.includes("success") ||
        valStr.includes("published") ||
        valStr.includes("paid") ||
        valStr.includes("operational") ||
        valStr.includes("nominal") ||
        valStr.includes("resolved")
      ) {
        colorClass = "bg-success-light text-success-text border-success-border";
      } else if (
        valStr.includes("pending") ||
        valStr.includes("warning") ||
        valStr.includes("draft") ||
        valStr.includes("investigating") ||
        valStr.includes("degraded") ||
        valStr.includes("in progress")
      ) {
        colorClass = "bg-warning-light text-warning-text border-warning-border";
      } else if (
        valStr.includes("error") ||
        valStr.includes("failed") ||
        valStr.includes("inactive") ||
        valStr.includes("critical") ||
        valStr.includes("major") ||
        valStr.includes("down") ||
        valStr.includes("breached")
      ) {
        colorClass = "bg-error-light text-error-text border-error-border";
      }
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${colorClass}`}
        >
          {String(value)}
        </span>
      );
    }

    return (
      <span
        className={`font-sans truncate max-w-[280px] inline-block align-middle ${variant === "dark-panel" ? "text-slate-200" : "text-foreground"}`}
        title={String(value)}
      >
        {String(value)}
      </span>
    );
  };

  return (
    <div className={`@container w-full min-w-0 flex flex-col ${className}`}>
      {/* Degraded State Indicator Banner */}
      {effectiveState === "degraded" && (
        <div className="bg-muted/70 border border-b-0 border-border rounded-t-lg px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin opacity-70" />
            <span>{degradedMessage}</span>
          </div>
          <span className="text-[10px] font-mono opacity-60">STALE_CACHE</span>
        </div>
      )}

      {/* Table Frame: Single Tab Stop when isInteractive */}
      <div
        ref={tableRef}
        tabIndex={isInteractive ? 0 : undefined}
        onFocus={() => setIsTableFocused(true)}
        onBlur={() => setIsTableFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label="Data Table"
        className={`w-full overflow-x-auto ${
          variant === "dark-panel"
            ? "border border-border bg-card/90 rounded-xl shadow-inner text-foreground"
            : `border border-border bg-card ${effectiveState === "degraded" ? "rounded-b-lg" : "rounded-lg"}`
        } ${
          isInteractive
            ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : ""
        }`}
      >
        <table className="w-full text-xs text-left border-collapse">
          {/* Header Row */}
          <thead>
            <tr className={variant === "dark-panel" ? "border-b border-border bg-surface-sunken/60" : "border-b border-border bg-muted/40"}>
              {normalizedCols.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-4 py-2.5 select-none whitespace-nowrap ${
                    variant === "dark-panel"
                      ? "text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold"
                      : "text-xs text-muted-foreground font-medium"
                  } ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* 1. Loading Skeleton State */}
            {effectiveState === "loading" && (
              <>
                {[1, 2, 3, 4].map((rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border/50 last:border-0">
                    {normalizedCols.map((col, colIdx) => (
                      <td key={colIdx} className="px-3 py-2">
                        <div
                          className={`h-3.5 rounded bg-muted animate-pulse ${
                            col.align === "right" ? "ml-auto" : ""
                          }`}
                          style={{
                            width: `${Math.max(35, Math.min(85, (colIdx + rowIdx * 3) * 17 % 50 + 40))}%`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {/* 2. Scoped Error State */}
            {effectiveState === "error" && (
              <tr>
                <td colSpan={normalizedCols.length} className="p-8 text-center bg-error-light/30">
                  <div className="flex flex-col items-center justify-center gap-1.5 max-w-sm mx-auto">
                    <AlertCircle className="w-4 h-4 text-error" />
                    <span className="text-xs font-semibold text-error-text">Failed to load dataset</span>
                    <span className="text-[11px] text-muted-foreground">{effectiveErrorMessage}</span>
                  </div>
                </td>
              </tr>
            )}

            {/* 3. Empty State */}
            {effectiveState === "empty" && (
              <tr>
                <td
                  colSpan={normalizedCols.length}
                  className="py-8 text-center text-xs text-muted-foreground"
                >
                  No records found in this view.
                </td>
              </tr>
            )}

            {/* 4. Loaded & Degraded States */}
            {(effectiveState === "loaded" || effectiveState === "degraded") &&
              resolvedData.map((row, rowIdx) => {
                const isRowFocused = isInteractive && isTableFocused && focusedIndex === rowIdx;
                const rowBorderClass = variant === "dark-panel"
                  ? "h-[56px] border-b border-white/5 last:border-0 hover:bg-white/[0.04]"
                  : "border-b border-border/60 last:border-0 hover:bg-muted/40";
                return (
                  <tr
                    key={rowIdx}
                    onClick={() => onRowClick && onRowClick(row, rowIdx)}
                    className={`${rowBorderClass} transition-colors ${
                      isInteractive ? "cursor-pointer" : ""
                    } ${
                      isRowFocused
                        ? "bg-muted/70 ring-1 ring-inset ring-ring"
                        : ""
                    }`}
                  >
                    {normalizedCols.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-4 ${variant === "dark-panel" ? "py-3" : "py-2"} whitespace-nowrap text-xs ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        }`}
                      >
                        {renderCellContent(col, getCellValue(row, col.key), rowIdx)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
