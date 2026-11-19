"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, RefreshCw, BarChart2 } from "lucide-react";

export interface TrendChartProps {
  title?: string;
  caption?: string;
  value?: number;
  valueSuffix?: string;
  decimals?: number;
  updatedText?: string;
  trend?: "up" | "down" | "none";
  period?: string;
  defaultPeriod?: string;
  periods?: string[];
  data?: number[];
  labels?: string[];
  accent?: string;
  width?: number;
  loop?: number;
  backdrop?: boolean;
  state?: "loading" | "loaded" | "empty" | "error" | "degraded";
  errorMessage?: string;
  className?: string;
}

const CW = 540;
const CH = 696;
const CR = 56;
const HN = CH / CW;

function TrendChartSkeleton({ width = 380 }: { width?: number }) {
  const height = width * HN;
  const radius = (CR * width) / CW;
  return (
    <div
      role="status"
      aria-label="Loading chart data"
      style={{
        width,
        height,
        borderRadius: radius,
      }}
      className="bg-[#08101a] border border-white/10 animate-pulse relative overflow-hidden flex flex-col justify-between p-6 select-none"
    >
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-white/10 rounded-full" />
        <div className="h-6 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="w-full h-32 flex items-center justify-center">
        <div className="w-full h-1 bg-white/10 rounded-full" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="h-4 w-32 bg-white/10 rounded-full" />
        <div className="h-12 w-44 bg-white/10 rounded-lg" />
        <div className="h-3 w-40 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

// Next/dynamic with ssr: false for lazy client-side rendering after first paint
const PeakChartDynamic = dynamic(
  () => import("@/components/vendor/peak-chart/peak-chart"),
  {
    ssr: false,
    loading: () => <TrendChartSkeleton width={380} />,
  }
);

export function TrendChart({
  title = "Workflow executions",
  caption = "Recorded in current billing cycle",
  value = 14200,
  valueSuffix = " runs",
  decimals = 0,
  updatedText = "Sample data",
  trend = "up",
  period,
  defaultPeriod = "Monthly",
  periods = ["Weekly", "Monthly", "Yearly"],
  data,
  labels,
  accent = "#6D5BF0",
  width = 380,
  loop = 0,
  backdrop = false,
  state = "loaded",
  errorMessage,
  className = "",
}: TrendChartProps) {
  const [retryKey, setRetryKey] = useState(0);

  // State 1: Loading
  if (state === "loading") {
    return <TrendChartSkeleton width={width} />;
  }

  // State 4: Error
  if (state === "error") {
    const height = width * HN;
    const radius = (CR * width) / CW;
    return (
      <div
        role="alert"
        style={{ width, height, borderRadius: radius }}
        className={`bg-error-light border border-error-border text-error-text p-6 flex flex-col items-center justify-center gap-3 text-center ${className}`}
      >
        <AlertCircle className="w-8 h-8 text-error shrink-0" />
        <div className="text-sm font-semibold">Failed to load trend chart</div>
        <p className="text-xs text-muted-foreground max-w-[28ch]">
          {errorMessage || "Unable to retrieve metrics for the specified period."}
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-background text-foreground border border-border hover:bg-muted transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // State 3: Empty (data provided but contains 0 items)
  if (state === "empty" || (data !== undefined && data.length === 0)) {
    const height = width * HN;
    const radius = (CR * width) / CW;
    return (
      <div
        role="status"
        style={{ width, height, borderRadius: radius }}
        className={`bg-muted/40 border border-border p-6 flex flex-col items-center justify-center gap-3 text-center ${className}`}
      >
        <BarChart2 className="w-8 h-8 text-muted-foreground/60" />
        <div className="text-sm font-medium text-foreground">No data points recorded</div>
        <p className="text-xs text-muted-foreground max-w-[28ch]">
          Metrics will appear here once executions begin in this period.
        </p>
      </div>
    );
  }

  // State 2: Default Loaded
  return (
    <div
      key={retryKey}
      data-testid="trend-chart-container"
      className={`relative inline-flex items-center justify-center max-w-full ${className}`}
    >
      <PeakChartDynamic
        title={title}
        caption={caption}
        value={value}
        valueSuffix={valueSuffix}
        decimals={decimals}
        updatedText={updatedText}
        trend={trend}
        period={period}
        defaultPeriod={defaultPeriod}
        periods={periods}
        data={data}
        labels={labels}
        accent={accent}
        width={width}
        loop={loop}
        backdrop={backdrop}
      />
    </div>
  );
}

export default TrendChart;
