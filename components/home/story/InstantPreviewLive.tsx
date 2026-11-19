"use client";

import { useEffect, useRef, useState } from "react";
import { LazyMotion, domAnimation, AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, Code } from "lucide-react";
import { RenderNode } from "@/registry";

const TARGET_LABEL = "ARR Growth";
const TARGET_VALUE = "$64,800";

export function InstantPreviewLive() {
  const shouldReduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [phase, setPhase] = useState(shouldReduceMotion ? 2 : 0);
  const [typedLen, setTypedLen] = useState(shouldReduceMotion ? TARGET_VALUE.length : 0);

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

  // Phase 0: initial ("Revenue" / "$48,200")
  // Phase 1: typing "$64,800" into value line
  // Phase 2: preview crossfades to ("ARR Growth" / "$64,800" / "+24%")
  useEffect(() => {
    if (shouldReduceMotion) {
      setPhase(2);
      setTypedLen(TARGET_VALUE.length);
      return;
    }
    if (!inView) return;

    let step = 0;
    const id = globalThis.setInterval(() => {
      if (document.hidden) return;
      step = (step + 1) % 28;
      if (step < 6) {
        setPhase(0);
        setTypedLen(0);
      } else if (step < 14) {
        setPhase(1);
        setTypedLen(Math.min(TARGET_VALUE.length, step - 5));
      } else {
        setPhase(2);
        setTypedLen(TARGET_VALUE.length);
      }
    }, 260);

    return () => globalThis.clearInterval(id);
  }, [inView, shouldReduceMotion]);

  const isUpdated = shouldReduceMotion || phase === 2;
  const shownLabel = isUpdated ? TARGET_LABEL : "Revenue";
  const shownCodeValue =
    phase === 0 ? "$48,200" : phase === 1 ? TARGET_VALUE.slice(0, Math.max(1, typedLen)) : TARGET_VALUE;

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={rootRef}
        data-testid="live-instant-preview"
        className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none"
      >
        <div className="w-full max-w-[540px] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5">
          {/* Left: Mini config editor with live typing line */}
          <div className="glass-3 rounded-2xl p-4 w-full sm:w-[240px] border border-border font-mono text-[12px] leading-[1.75] shrink-0">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border font-sans">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Code className="w-3.5 h-3.5 text-brand-link" />
                <span className="text-[12px] font-medium text-foreground">config.json</span>
              </div>
              <span className="text-[11px] font-mono text-success-text font-medium">
                Valid
              </span>
            </div>
            <div className="text-muted-foreground">
              <span className="token-bracket">&#123;</span>
              <br />
              &nbsp;&nbsp;<span className="token-key">&quot;type&quot;</span>:{" "}
              <span className="token-string">&quot;Statistic&quot;</span>,
              <br />
              <span className={`block rounded px-1 -mx-1 ${isUpdated ? "bg-brand-light" : ""}`}>
                &nbsp;&nbsp;<span className="token-key">&quot;label&quot;</span>:{" "}
                <span className="token-string">&quot;{shownLabel}&quot;</span>,
              </span>
              <span
                className={`block rounded px-1 -mx-1 transition-colors ${
                  phase >= 1 ? "bg-brand-light" : ""
                }`}
              >
                &nbsp;&nbsp;<span className="token-key">&quot;value&quot;</span>:{" "}
                <span className="token-string">&quot;{shownCodeValue}&quot;</span>
                {phase === 1 && !shouldReduceMotion && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-[2px] h-[13px] bg-brand-link align-middle ml-0.5 animate-pulse"
                  />
                )}
              </span>
              <span className="token-bracket">&#125;</span>
            </div>
          </div>

          {/* Center directional indicator */}
          <div className="flex items-center justify-center shrink-0 text-brand-link">
            <ArrowRight className="w-4 h-4 hidden sm:block" />
            <ArrowDown className="w-4 h-4 sm:hidden" />
          </div>

          {/* Right: Real RenderNode preview updating in sync with crossfade */}
          <div className="w-full sm:flex-1 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={isUpdated ? "updated" : "initial"}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.28 }}
              >
                <RenderNode
                  config={{
                    type: "Statistic",
                    label: isUpdated ? TARGET_LABEL : "Revenue",
                    value: isUpdated ? TARGET_VALUE : "$48,200",
                    trend: {
                      value: isUpdated ? "+24%" : "+18%",
                      sentiment: "positive",
                    },
                  }}
                />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
