"use client";

import { useEffect, useRef, useState } from "react";

export interface AnimatedSparklineProps {
  series?: number[];
  className?: string;
  width?: number;
  height?: number;
}

export function AnimatedSparkline({
  series = [24, 28, 27, 36, 42, 45, 54],
  className = "",
  width = 200,
  height = 52,
}: AnimatedSparklineProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [isDrawn, setIsDrawn] = useState(false);
  const [showDot, setShowDot] = useState(false);

  // Normalize points with safe padding
  const paddingX = 6;
  const paddingTop = 8;
  const paddingBottom = 6;

  const validSeries = series.length >= 2 ? series : [24, 28, 27, 36, 42, 45, 54];
  const min = Math.min(...validSeries);
  const max = Math.max(...validSeries);
  const range = max - min || 1;

  const points = validSeries.map((val, idx) => {
    const x = paddingX + (idx / (validSeries.length - 1)) * (width - 2 * paddingX);
    const norm = (val - min) / range;
    const y = height - paddingBottom - norm * (height - paddingTop - paddingBottom);
    return { x, y };
  });

  // Generate smooth cubic bezier line path
  let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaD = `${pathD} L ${lastPoint.x.toFixed(1)} ${height} L ${firstPoint.x.toFixed(1)} ${height} Z`;

  useEffect(() => {
    // Check prefers-reduced-motion: if enabled, show full final static state immediately
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setIsDrawn(true);
        setShowDot(true);
        return;
      }
    }

    let drawTimer: NodeJS.Timeout;
    let dotTimer: NodeJS.Timeout;

    // Use IntersectionObserver to start animation within ~150ms of entering view
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Within ~150ms of entering view, trigger draw-in over 600ms
          drawTimer = setTimeout(() => {
            setIsDrawn(true);
            // 6px end dot appears when line draw finishes (~600ms later)
            dotTimer = setTimeout(() => {
              setShowDot(true);
            }, 600);
          }, 150);

          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      clearTimeout(drawTimer);
      clearTimeout(dotTimer);
    };
  }, []);

  return (
    <svg
      ref={containerRef}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full overflow-visible ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparklineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Subtle area fill underneath */}
      <path
        d={areaD}
        fill="url(#sparklineAreaGrad)"
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: isDrawn ? 1 : 0.4 }}
      />

      {/* 1. Base full static line: ALWAYS visible at 30% opacity on first paint (NEVER empty) */}
      <path
        d={pathD}
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Animated draw-in line: draws in over ~600ms with ease-out cubic-bezier(0.15, 0, 0.2, 1) */}
      <path
        d={pathD}
        pathLength="100"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity={isDrawn ? "1" : "0"}
        strokeDasharray="100"
        strokeDashoffset={isDrawn ? 0 : 100}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition:
            "stroke-dashoffset 600ms cubic-bezier(0.15, 0, 0.2, 1), stroke-opacity 150ms ease",
        }}
      />

      {/* 3. 6px end dot (r=3 -> 6px diameter) at the peak/terminal point */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="3"
        fill="#FFFFFF"
        style={{
          opacity: showDot ? 1 : 0,
          transform: showDot ? "scale(1)" : "scale(0.4)",
          transformOrigin: `${lastPoint.x}px ${lastPoint.y}px`,
          transition:
            "opacity 150ms ease-out, transform 200ms cubic-bezier(0.15, 0, 0.2, 1)",
        }}
      />
    </svg>
  );
}
