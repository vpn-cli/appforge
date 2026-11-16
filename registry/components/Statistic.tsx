import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
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

export function Statistic({
  label,
  title,
  value = "1,244",
  trend,
  trendValue,
  chartWave,
  icon,
  variant,
  className = "",
}: StatisticProps) {
  const { isInCard } = useCardContext();
  const effectiveLabel = label || title || "Active Workflows";

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
  } else if (variant === "panel" || chartWave) {
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
    colorClass = "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full";
  } else if (sentiment === "negative") {
    colorClass = "text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full";
  }

  const isPanel = variant === "panel" || chartWave !== undefined;

  if (isPanel) {
    return (
      <div
        className={`@container relative overflow-hidden rounded-xl bg-[#1A1B29] p-5 text-white border border-white/5 shadow-inner min-w-0 ${className}`}
      >
        {/* Soft purple area-chart wave behind number */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70">
          <svg
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            className="w-full h-full"
            fill="none"
          >
            <defs>
              <linearGradient id="purpleWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#6366F1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4338CA" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 80 Q 80 40, 160 70 T 320 30 T 400 50 L 400 120 L 0 120 Z"
              fill="url(#purpleWaveGrad)"
            />
            <path
              d="M0 80 Q 80 40, 160 70 T 320 30 T 400 50"
              stroke="#A5B4FC"
              strokeWidth="2"
              strokeOpacity="0.6"
              fill="none"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          {/* Header row with indigo dot and label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6366F1] shadow-[0_0_8px_#6366F1]" />
              <p className="text-xs font-medium text-slate-300 tracking-tight truncate">
                {effectiveLabel}
              </p>
            </div>
            {icon === "users" || isPanel ? (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                <Users className="w-4 h-4 text-slate-300" />
              </div>
            ) : null}
          </div>

          {/* Value and Growth pill */}
          <div className="flex items-center gap-3">
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
              {formatCompactString(value)}
            </h3>

            {trendStrValue && (
              <div
                className={`flex items-center gap-1 text-[11px] font-semibold tabular-nums ${colorClass}`}
              >
                {direction === "up" && <TrendingUp className="w-3 h-3" />}
                {direction === "down" && <TrendingDown className="w-3 h-3" />}
                {direction === "neutral" && <Minus className="w-3 h-3" />}
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
          {formatCompactString(value)}
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
