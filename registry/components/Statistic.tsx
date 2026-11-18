"use client";

import { TrendingUp, TrendingDown, Minus, Users, ArrowUpRight } from "lucide-react";
import { useCardContext } from "../context";

export interface TrendObject {
  value?: string;
  label?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface StatisticProps {
  label?: string;
  title?: string;
  value?: string | number;
  format?: "compact" | "full" | "auto";
  trend?: "up" | "down" | "neutral" | TrendObject;
  trendValue?: string;
  chartWave?: boolean;
  icon?: "users" | "workflow" | string;
  variant?: "default" | "panel";
  className?: string;
}

function formatCompactString(val: string | number) {
  if (val === null || val === undefined || val === "") return "0";
  const strVal = String(val);
  const match = strVal.replace(/,/g, "").match(/([\d.]+)/);
  if (!match) return strVal;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return strVal;

  let formatted = "";
  if (num >= 1000000) {
    formatted = (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (num >= 1000) {
    formatted = (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return strVal;
  }

  return strVal.replace(/[\d,.]+/, formatted);
}

function formatDisplayValue(val: string | number, format?: "compact" | "full" | "auto") {
  if (val === null || val === undefined || val === "") return "0";
  if (format === "full") {
    if (typeof val === "number") return val.toLocaleString();
    return String(val);
  }
  if (format === "compact") {
    return formatCompactString(val);
  }
  // Auto / Default: if string already has commas like "1,244", preserve it!
  const str = String(val);
  if (str.includes(",")) return str;
  return formatCompactString(val);
}

export function Statistic({
  label,
  title,
  value = "1,244",
  format,
  trend,
  trendValue,
  chartWave,
  icon,
  variant,
  className = "",
}: StatisticProps) {
  const { isInCard } = useCardContext();
  const effectiveLabel = label || title || "Active Workflows";
  const isPanel = variant === "panel" || chartWave !== undefined;

  // Normalize trend values and sentiment
  let trendStrValue = "";
  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  let direction: "up" | "down" | "neutral" = "neutral";

  if (typeof trend === "object" && trend !== null) {
    trendStrValue = trend.value || trend.label || "";
    if (trend.sentiment) {
      sentiment = trend.sentiment;
    }
  } else if (typeof trend === "string") {
    direction = trend;
    trendStrValue = trendValue || "";
  } else if (trendValue) {
    trendStrValue = trendValue;
  } else if (isPanel) {
    trendStrValue = "+12%";
    sentiment = "positive";
  }

  // Arrow direction follows the sign:
  if (trendStrValue.startsWith("+") || direction === "up") {
    direction = "up";
  } else if (trendStrValue.startsWith("-") || direction === "down") {
    direction = "down";
  }

  // Color handling
  let colorClass = "text-muted-foreground";
  if (sentiment === "positive") {
    colorClass = "text-success-text";
  } else if (sentiment === "negative") {
    colorClass = "text-error-text";
  }

  const effectiveValue = isPanel && format !== "compact"
    ? (typeof value === "number" ? value.toLocaleString() : String(value))
    : formatDisplayValue(value, format);

  if (isPanel) {
    return (
      <div
        className={`@container relative overflow-hidden rounded-xl bg-card/90 p-5 sm:p-6 text-foreground border border-border shadow-inner min-w-0 min-h-[160px] flex flex-col justify-between ${className}`}
      >
        {/* Soft filled area chart wave behind the number matching reference sweeping curve */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <svg
            viewBox="0 0 500 160"
            preserveAspectRatio="none"
            className="w-full h-full"
            fill="none"
          >
            <defs>
              <linearGradient id="purpleAreaWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--brand-400)" stopOpacity="0.45" />
                <stop offset="50%" stopColor="var(--brand-500)" stopOpacity="0.20" />
                <stop offset="100%" stopColor="var(--brand-800)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="backWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--brand-300)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--brand-600)" stopOpacity="0" />
              </linearGradient>
              <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Back subtle wave */}
            <path
              d="M 240 140 C 310 110, 380 50, 500 30 L 500 160 L 240 160 Z"
              fill="url(#backWaveGrad)"
            />
            {/* Primary wave filled area rising smoothly to a glowing crest */}
            <path
              d="M 140 145 C 220 145, 270 110, 320 85 C 360 65, 390 80, 430 50 C 460 25, 485 30, 500 40 L 500 160 L 140 160 Z"
              fill="url(#purpleAreaWaveGrad)"
            />
            {/* Glowing crest line */}
            <path
              d="M 140 145 C 220 145, 270 110, 320 85 C 360 65, 390 80, 430 50 C 460 25, 485 30, 500 40"
              stroke="var(--brand-200)"
              strokeWidth="2.5"
              strokeOpacity="0.9"
              fill="none"
              filter="url(#purpleGlow)"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
          {/* Header row with brand dot and label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_var(--brand-400)]" />
              <p className="text-xs sm:text-sm font-medium text-muted-foreground tracking-tight truncate">
                {effectiveLabel}
              </p>
            </div>
            {icon === "users" || isPanel ? (
              <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-link flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-4 h-4 text-brand-link" strokeWidth={1.75} />
              </div>
            ) : null}
          </div>

          {/* Value and Growth pill: 52px bold number */}
          <div className="flex items-center gap-3.5">
            <h3 className="text-4xl sm:text-[52px] font-bold tracking-tight text-foreground leading-none tabular-nums">
              {effectiveValue}
            </h3>

            {trendStrValue && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-status-success-bg text-status-success-text border border-status-success-border shrink-0 select-none">
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span>{trendStrValue}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const containerClasses = isInCard
    ? `@container flex flex-col gap-2 min-w-0 p-2 sm:p-2.5 bg-transparent border-0 rounded-none shadow-none ${className}`
    : `@container bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3 min-w-0 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Single-line label truncates with title attribute */}
      <p
        className="text-xs font-medium text-muted-foreground tracking-tight truncate min-w-0 block"
        title={effectiveLabel}
      >
        {effectiveLabel}
      </p>

      {/* Value and trend stack vertically when narrow (flex-wrap) */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 min-w-0">
        <h3
          className="font-bold text-foreground font-sans tabular-nums tracking-tight leading-none break-words [overflow-wrap:anywhere] min-w-0"
          style={{
            fontSize: "clamp(1.125rem, 5cqi + 0.5rem, 1.875rem)",
          }}
        >
          {effectiveValue}
        </h3>

        {trendStrValue && (
          <div
            className={`flex items-center gap-1 shrink-0 text-xs font-medium font-sans tabular-nums ${colorClass}`}
          >
            {direction === "up" && <TrendingUp className="w-3.5 h-3.5" />}
            {direction === "down" && <TrendingDown className="w-3.5 h-3.5" />}
            {direction === "neutral" && <Minus className="w-3.5 h-3.5" />}
            <span className="whitespace-nowrap">{trendStrValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
