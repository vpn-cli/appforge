"use client";

import { useEffect, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { RenderNode } from "@/registry";

export function AiCopilotLive() {
  const shouldReduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [stage, setStage] = useState(shouldReduceMotion ? 2 : 0);

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
    if (shouldReduceMotion) {
      setStage(2);
      return;
    }
    if (!inView) return;

    const id = globalThis.setInterval(() => {
      if (document.hidden) return;
      setStage((prev) => (prev >= 2 ? 0 : prev + 1));
    }, 2000);

    return () => globalThis.clearInterval(id);
  }, [inView, shouldReduceMotion]);

  const activeStage = shouldReduceMotion ? 2 : stage;

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={rootRef}
        data-testid="live-ai-copilot"
        className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none"
      >
        <div className="w-full max-w-[520px] flex flex-col gap-3.5">
          {/* Prompt Bar */}
          <div className="glass-3 rounded-xl p-3.5 border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 text-brand-link shrink-0" />
              <span className="text-[13px] text-foreground truncate">
                &quot;Create an incident triage board with SLA metrics&quot;
              </span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-light text-brand-link shrink-0">
              {activeStage === 0 ? "Streaming..." : "Groq → Gemini"}
            </span>
          </div>

          {/* Generated Real Registry Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[104px]">
            <m.div
              animate={{
                opacity: activeStage >= 1 ? 1 : 0.4,
                y: activeStage >= 1 ? 0 : 4,
              }}
              transition={{ duration: 0.25 }}
            >
              <RenderNode
                config={{
                  type: "Statistic",
                  label: "Open Incidents",
                  value: "2",
                  trend: { value: "-3", sentiment: "positive" },
                }}
              />
            </m.div>

            <m.div
              animate={{
                opacity: activeStage >= 2 ? 1 : 0.4,
                y: activeStage >= 2 ? 0 : 4,
              }}
              transition={{ duration: 0.25, delay: 0.08 }}
            >
              <RenderNode
                config={{
                  type: "Statistic",
                  label: "SLA Compliance",
                  value: "99.98%",
                  trend: { value: "+0.1%", sentiment: "positive" },
                }}
              />
            </m.div>
          </div>

          {/* Validation Status Footer */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-[12px] font-mono text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 text-success-text">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeStage === 0
                ? "Validating AST stream..."
                : activeStage === 1
                ? "1/2 nodes validated"
                : "2/2 nodes validated"}
            </span>
            <span>Strict JSON AST</span>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
