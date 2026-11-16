import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCardContext } from "../context";

export interface TrendObject {
  value?: string;
  label?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface StatisticProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral" | TrendObject;
  trendValue?: string;
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

export function Statistic({ label, value, trend, trendValue }: StatisticProps) {
  const { isInCard } = useCardContext();

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
  }

  // Arrow direction follows the sign:
  if (trendStrValue.startsWith("+") || direction === "up") {
    direction = "up";
  } else if (trendStrValue.startsWith("-") || direction === "down") {
    direction = "down";
  }

  // Color does NOT follow the sign. It defaults to neutral (muted text) when absent!
  let colorClass = "text-muted-foreground";
  if (sentiment === "positive") {
    colorClass = "text-success-text";
  } else if (sentiment === "negative") {
    colorClass = "text-error-text";
  }

  const containerClasses = isInCard
    ? "@container flex flex-col gap-2 min-w-0 p-2 sm:p-2.5 bg-transparent border-0 rounded-none shadow-none"
    : "@container bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3 min-w-0";

  return (
    <div className={containerClasses}>
      {/* Single-line label truncates with title attribute */}
      <p
        className="text-xs font-medium text-muted-foreground tracking-tight truncate min-w-0 block"
        title={label || "Statistic"}
      >
        {label || "Statistic"}
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
