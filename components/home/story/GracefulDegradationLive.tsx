"use client";

import { useEffect, useRef, useState } from "react";
import { LazyMotion, domAnimation, AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ShieldAlert, TrendingUp } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { RenderNode } from "@/registry";

export function GracefulDegradationLive() {
  const shouldReduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (shouldReduceMotion || !inView) return;
    const id = globalThis.setInterval(() => {
      if (document.hidden) return;
      setTick((prev) => prev + 1);
    }, 1800);
    return () => globalThis.clearInterval(id);
  }, [inView, shouldReduceMotion]);

  // Cycle: step 0 = healthy, steps 1..3 = tile 2 flips to InvalidNodeFallback while siblings keep updating
  const isBroken = shouldReduceMotion ? true : tick % 4 !== 0;
  const activeUsers = 12840 + (shouldReduceMotion ? 24 : (tick % 8) * 6);
  const recordsSynced = 4312 + (shouldReduceMotion ? 18 : (tick % 8) * 5);
  const apiRequests = 98420 + (shouldReduceMotion ? 64 : (tick % 8) * 17);

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={rootRef}
        data-testid="live-graceful-degradation"
        className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none"
      >
        <div className="w-full max-w-[520px] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Tile 1: Live Active Users with Magic UI NumberTicker */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[126px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">
                Active Users
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-success-text">
                <TrendingUp className="w-3 h-3" />
                +14%
              </span>
            </div>
            <div className="text-[26px] font-bold tracking-tight text-foreground leading-none">
              <NumberTicker value={activeUsers} startValue={12840} />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Sibling unaffected
            </span>
          </div>

          {/* Tile 2: Flips between healthy component and red-rim InvalidNodeFallback */}
          <div
            className={`rounded-xl border transition-colors duration-300 p-3 flex flex-col justify-center min-h-[126px] overflow-hidden ${
              isBroken
                ? "border-error-border bg-error-light/70 ring-1 ring-error-border"
                : "border-border bg-card shadow-sm"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isBroken ? (
                <m.div
                  key="fallback"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-mono font-semibold text-error-text">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      InvalidNodeFallback
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-error-light text-error-text border border-error-border">
                      Isolated
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-error-text leading-snug">
                    &lt;DataTable /&gt;: missing columns
                  </p>
                  <div className="[&>div]:my-0 [&>div]:p-2 [&>div]:border-error-border/60 [&>div]:bg-card/80 [&>div]:text-[11px] [&_details]:hidden [&_p]:hidden">
                    <RenderNode config={{ type: "DataTable", columns: "missing" }} />
                  </div>
                </m.div>
              ) : (
                <m.div
                  key="healthy"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col justify-between h-full gap-2 p-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-muted-foreground">
                      DataTable Node
                    </span>
                    <span className="text-[11px] font-mono text-success-text">Valid</span>
                  </div>
                  <div className="text-[13px] font-mono text-foreground">
                    columns: [&quot;id&quot;, &quot;status&quot;]
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Schema verified
                  </span>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tile 3: Live Records Synced with Magic UI NumberTicker */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[126px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">
                Records Synced
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-success-text">
                <TrendingUp className="w-3 h-3" />
                +6%
              </span>
            </div>
            <div className="text-[26px] font-bold tracking-tight text-foreground leading-none">
              <NumberTicker value={recordsSynced} startValue={4312} />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Updating continuously
            </span>
          </div>

          {/* Tile 4: Live API Requests with Magic UI NumberTicker */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[126px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">
                API Requests
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-success-text">
                <TrendingUp className="w-3 h-3" />
                +2.4%
              </span>
            </div>
            <div className="text-[26px] font-bold tracking-tight text-foreground leading-none">
              <NumberTicker value={apiRequests} startValue={98420} />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Proxy route active
            </span>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
