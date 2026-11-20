"use client";

import { TrendingUp, TrendingDown, Minus, Users, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useCardContext } from "../context";
import { AnimatedSparkline } from "@/components/ui/animated-sparkline";

export interface TrendObject {
  value?: string;
  label?: string;
  direction?: "up" | "down" | "neutral";
  sentiment?: "positive" | "negative" | "neutral";
  series?: number[];
}

export interface StatisticProps {
  label?: string;
  title?: string;
  value?: string | number;
  suffix?: string;
  format?: "compact" | "full" | "auto";
  trend?: "up" | "down" | "neutral" | TrendObject;
  trendValue?: string;
  chartWave?: boolean;
  icon?: "users" | "workflow" | string;
  variant?: "default" | "panel" | "gradient";
  className?: string;
}

export function parseValueAndSuffix(val: string | number, propSuffix?: string) {
  if (propSuffix !== undefined && propSuffix !== null) {
    const s = String(propSuffix);
    const normSuffix = s.startsWith(" ") ? s : ` ${s}`;
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "")) || 0;
    return { num, suffix: normSuffix, rawVal: val };
  }
  if (typeof val === "string") {
    const match = val.match(/^([\d,.]+)(\s+.*)$/);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, "")) || 0;
      return { num, suffix: match[2], rawVal: val };
    }
  }
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "")) || 0;
  return { num, suffix: "", rawVal: val };
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
  suffix,
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
  const isGradient = variant === "gradient";
  const isPanel = variant === "panel" || chartWave !== undefined;

  // Normalize trend values and sentiment
  let trendStrValue = "";
  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  let direction: "up" | "down" | "neutral" = "neutral";
  let trendSeries: number[] | undefined = undefined;

  if (typeof trend === "object" && trend !== null) {
    if (Array.isArray(trend.series) && trend.series.length >= 2) {
      trendSeries = trend.series;
      const first = trend.series[0];
      const last = trend.series[trend.series.length - 1];
      const pct = first !== 0 ? Math.round(((last - first) / first) * 100) : 0;
      trendStrValue = `${pct >= 0 ? "+" : ""}${pct}%`;
      sentiment = pct >= 0 ? "positive" : "negative";
      direction = pct >= 0 ? "up" : "down";
    }
    if (trend.value || trend.label) {
      trendStrValue = trend.value || trend.label || trendStrValue;
    }
    if (trend.sentiment) {
      sentiment = trend.sentiment;
    }
    if (trend.direction) {
      direction = trend.direction;
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

  // Parse numeric value and suffix (always preserving leading spaces)
  const parsed = parseValueAndSuffix(value, suffix);
  const targetNumber = parsed.num;
  const valSuffix = parsed.suffix;

  const effectiveValue = (isPanel || isGradient) && format !== "compact"
    ? `${targetNumber.toLocaleString("en-US")}${valSuffix}`
    : `${formatDisplayValue(targetNumber, format)}${valSuffix}`;

  // Number animation for gradient card: Frame 0 shows final value (1,244), no count-up from 0.
  // Subtle roll from a nearby value only over 400ms (duration-slow token) after 150ms delay.
  const [animatedNumber, setAnimatedNumber] = useState<number>(() => targetNumber);

  useEffect(() => {
    if (!isGradient) return;

    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        setAnimatedNumber(targetNumber);
        return;
      }
    }

    const startNearby = Math.max(0, targetNumber - 6);
    let rafId: number;
    const timer = setTimeout(() => {
      const startTime = performance.now();
      const duration = 400;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startNearby + (targetNumber - startNearby) * easeOut);
        setAnimatedNumber(current);

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          setAnimatedNumber(targetNumber);
        }
      };

      rafId = requestAnimationFrame(animate);
    }, 150);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [targetNumber, isGradient]);

  if (isGradient) {
    const gradientDisplayValue = `${animatedNumber.toLocaleString("en-US")}${valSuffix}`;

    return (
      <div
        className={`@container relative overflow-hidden rounded-2xl metric-card-gradient border border-white/25 text-white p-4 shadow-sm min-w-0 select-none ${className}`}
      >
        {/* Confined animated sparkline wave in bottom-right 45% */}
        <div
          className="absolute right-0 bottom-0 w-[45%] h-[52px] pointer-events-none select-none"
          aria-hidden="true"
        >
          <AnimatedSparkline series={trendSeries} />
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-white/90 tracking-tight truncate">
              {effectiveLabel}
            </p>
            <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-white" strokeWidth={1.8} />
            </div>
          </div>

          <div className="flex items-baseline gap-2.5">
            <div className="text-[32px] sm:text-[36px] font-bold tracking-tight text-white leading-none tabular-nums">
              {gradientDisplayValue}
            </div>
            {trendStrValue && (
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-white/15 border border-white/25 text-white shrink-0">
                <ArrowUpRight className="w-3 h-3" strokeWidth={2.2} />
                <span>{trendStrValue}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            <div className="text-4xl sm:text-[52px] font-bold tracking-tight text-foreground leading-none tabular-nums">
              {effectiveValue}
            </div>

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
        <div
          className="font-bold text-foreground font-sans tabular-nums tracking-tight leading-none break-words [overflow-wrap:anywhere] min-w-0"
          style={{
            fontSize: "clamp(1.125rem, 5cqi + 0.5rem, 1.875rem)",
          }}
        >
          {effectiveValue}
        </div>

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
