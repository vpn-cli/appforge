"use client";

import React, { useState, useRef } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface ColumnSchema {
  key: string;
  label?: string;
  type?: "text" | "number" | "currency" | "id" | "code" | "badge";
  align?: "left" | "right" | "center";
}

export type DataTableColumn = string | ColumnSchema;

export interface DataTableProps {
  columns?: DataTableColumn[];
  data?: Record<string, unknown>[];
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
  state = "loaded",
  errorMessage = "Unable to fetch live dataset. Verify entity connection.",
  degradedMessage = "Showing cached dataset · Live connection paused",
  isInteractive = false,
  onRowClick,
  className = "",
}: DataTableProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isTableFocused, setIsTableFocused] = useState<boolean>(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Normalize column definitions
  const normalizedCols: ColumnSchema[] = (columns.length > 0
    ? columns
    : data.length > 0
    ? Object.keys(data[0])
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
      : !data || data.length === 0
      ? "empty"
      : "loaded";

  // Single tab stop keyboard navigation for interactive tables
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive || data.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(data.length - 1, prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onRowClick && data[focusedIndex]) {
        onRowClick(data[focusedIndex], focusedIndex);
      }
    }
  };

  const renderCellContent = (col: ColumnSchema, value: unknown) => {
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
        <span className="font-mono text-[11px] text-muted-foreground select-all">
          {String(value)}
        </span>
      );
    }

    if (col.type === "badge") {
      const valStr = String(value).toLowerCase();
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
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colorClass}`}
        >
          {String(value)}
        </span>
      );
    }

    return (
      <span
        className="font-sans text-foreground truncate max-w-[280px] inline-block align-middle"
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
        className={`w-full overflow-x-auto border border-border bg-card ${
          effectiveState === "degraded" ? "rounded-b-lg" : "rounded-lg"
        } ${
          isInteractive
            ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : ""
        }`}
      >
        <table className="w-full text-xs text-left border-collapse">
          {/* Header Row: Sentence-case, hairline divider */}
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {normalizedCols.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-3 py-2 font-medium text-muted-foreground select-none whitespace-nowrap ${
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
                      <td key={colIdx} className="px-3 py-2.5">
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
                    <span className="text-[11px] text-muted-foreground">{errorMessage}</span>
                  </div>
                </td>
              </tr>
            )}

            {/* 3. Empty State (Preserves Headers & Frame) */}
            {effectiveState === "empty" && (
              <tr>
                <td
                  colSpan={normalizedCols.length}
                  className="py-12 text-center text-xs text-muted-foreground"
                >
                  No records found in this view.
                </td>
              </tr>
            )}

            {/* 4. Loaded & Degraded States */}
            {(effectiveState === "loaded" || effectiveState === "degraded") &&
              data.map((row, rowIdx) => {
                const isRowFocused = isInteractive && isTableFocused && focusedIndex === rowIdx;
                return (
                  <tr
                    key={rowIdx}
                    onClick={() => onRowClick && onRowClick(row, rowIdx)}
                    className={`border-b border-border/60 last:border-0 transition-colors ${
                      isInteractive ? "cursor-pointer" : ""
                    } ${
                      isRowFocused
                        ? "bg-muted/70 ring-1 ring-inset ring-ring"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    {normalizedCols.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-3 py-2 whitespace-nowrap text-xs ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        }`}
                      >
                        {renderCellContent(col, row[col.key])}
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
