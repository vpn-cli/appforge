import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatisticProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

function formatCompactString(val: string | number) {
  if (val === null || val === undefined) return "0";
  const strVal = String(val);
  const match = strVal.replace(/,/g, '').match(/([\d.]+)/);
  if (!match) return strVal;
  
  const num = parseFloat(match[1]);
  if (isNaN(num)) return strVal;

  let formatted = "";
  if (num >= 1000000) {
    formatted = (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1000) {
    formatted = (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return strVal;
  }
  
  return strVal.replace(/[\d,.]+/, formatted);
}

export function Statistic({ label, value, trend, trendValue }: StatisticProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
      <p className="text-xs font-medium text-muted-foreground tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{label || "Statistic"}</p>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold text-foreground font-mono tracking-tighter shrink-0 leading-none">
          {formatCompactString(value)}
        </h3>
        {trend && trendValue && (
          <div className="flex items-center gap-1 shrink-0 pr-1 text-xs">
            {trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-500" />}
            {trend === "down" && <TrendingDown className="w-4 h-4 text-rose-500" />}
            {trend === "neutral" && <Minus className="w-4 h-4 text-muted-foreground" />}
            
            <span className={`whitespace-nowrap font-semibold ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
