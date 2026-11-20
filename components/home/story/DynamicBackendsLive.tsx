"use client";

import { useEffect, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { Database, Layers } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { RenderNode } from "@/registry";

const ENTITIES = [
  { name: "users", meta: "4 fields · id, role" },
  { name: "projects", meta: "6 fields · org_id" },
  { name: "workflows", meta: "3 fields · trigger" },
] as const;

const POSTGRES_ROWS = [
  { workflow: "User Sync", status: "Active" },
  { workflow: "Invoice Gen", status: "Pending" },
  { workflow: "Slack Alerts", status: "Active" },
];

export function DynamicBackendsLive() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const ent0Ref = useRef<HTMLDivElement>(null);
  const ent1Ref = useRef<HTMLDivElement>(null);
  const ent2Ref = useRef<HTMLDivElement>(null);
  const dbRef = useRef<HTMLDivElement>(null);
  const entityRefs = [ent0Ref, ent1Ref, ent2Ref];

  const [inView, setInView] = useState(true);
  const [visibleRows, setVisibleRows] = useState(shouldReduceMotion ? 3 : 1);

  useEffect(() => {
    const el = containerRef.current;
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
      setVisibleRows(3);
      return;
    }
    if (!inView) return;

    const timer = globalThis.setInterval(() => {
      if (document.hidden) return;
      setVisibleRows((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 1500);

    return () => globalThis.clearInterval(timer);
  }, [inView, shouldReduceMotion]);

  const activeRows = POSTGRES_ROWS.slice(0, shouldReduceMotion ? 3 : visibleRows);

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={containerRef}
        data-testid="live-dynamic-backends"
        className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none"
      >
        {/* Magic UI Animated Beams connecting each entity card to the Postgres table */}
        <div className="hidden sm:block">
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={ent0Ref}
            toRef={dbRef}
            curvature={-28}
            duration={3.2}
            delay={0}
            paused={!inView}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={ent1Ref}
            toRef={dbRef}
            curvature={0}
            duration={3.2}
            delay={0.45}
            paused={!inView}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={ent2Ref}
            toRef={dbRef}
            curvature={28}
            duration={3.2}
            delay={0.9}
            paused={!inView}
          />
        </div>

        <div className="w-full max-w-[560px] flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-10 relative z-10">
          {/* Left: Entity definition cards */}
          <div className="flex flex-col gap-2.5 w-full sm:w-[196px] shrink-0">
            {ENTITIES.map((ent, idx) => {
              const isHighlighted = !shouldReduceMotion && visibleRows - 1 === idx;
              return (
                <m.div
                  key={ent.name}
                  ref={entityRefs[idx]}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: isHighlighted ? 1.02 : 1,
                        }
                  }
                  transition={{ duration: 0.25 }}
                  className={`glass-3 rounded-xl p-2.5 sm:p-3 flex items-center justify-between border transition-colors ${
                    isHighlighted ? "border-brand" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center text-brand-link shrink-0">
                      <Layers className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-mono font-semibold text-foreground truncate">
                        {ent.name}
                      </div>
                      <div className="text-[12px] text-muted-foreground font-mono truncate">
                        {ent.meta}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                      isHighlighted ? "bg-brand" : "bg-border-strong"
                    }`}
                  />
                </m.div>
              );
            })}
          </div>

          {/* Right: Live Postgres Table filling with rows via real RenderNode */}
          <div ref={dbRef} className="w-full sm:flex-1 min-w-0">
            <div className="glass-3 rounded-2xl p-4 border border-border flex flex-col gap-2.5 min-h-[212px]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Database className="w-3.5 h-3.5 text-brand-link shrink-0" />
                  <span className="font-mono text-[12px] font-semibold text-foreground truncate">
                    app_ops_workflows
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-light text-brand-link border border-border shrink-0">
                  RLS ON · {activeRows.length}/3
                </span>
              </div>

              <m.div
                key={activeRows.length}
                initial={shouldReduceMotion ? false : { opacity: 0.85, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <RenderNode
                  config={{
                    type: "DataTable",
                    columns: [
                      { key: "workflow", label: "Workflow", type: "text" },
                      { key: "status", label: "Status", type: "badge" },
                    ],
                    data: activeRows,
                  }}
                />
              </m.div>
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
