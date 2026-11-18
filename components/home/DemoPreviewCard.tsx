"use client";

import { Layers } from "lucide-react";
import { RenderNode } from "@/registry";
import { StatusPill } from "@/components/ui/status-pill";
import { HERO_DEMO_CONFIG } from "./heroDemoConfig";

export function DemoPreviewCard() {
  const components = HERO_DEMO_CONFIG.pages[0].components;

  return (
    <div
      data-testid="hero-preview-card"
      className="glass-1 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full transition-colors relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-light border border-border flex items-center justify-center text-brand-link shrink-0">
            <Layers className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <h2 className="text-[13px] font-semibold tracking-wide uppercase text-foreground truncate">
            Rendered Application
          </h2>
        </div>

        <StatusPill variant="neutral" showDot={false}>
          Rendered from config
        </StatusPill>
      </div>

      {/* Real Registry Component Output */}
      <div className="py-3 flex flex-col gap-3 flex-1 justify-center min-w-0">
        {components.map((node, idx) => (
          <RenderNode key={idx} config={node} />
        ))}
      </div>

      {/* Explicit Demo Data Disclosure */}
      <div className="pt-2.5 border-t border-border text-[13px] text-muted-foreground flex items-center justify-between gap-2 shrink-0">
        <span>Demo data</span>
        <span className="font-mono whitespace-nowrap shrink-0">ComponentRegistry</span>
      </div>
    </div>
  );
}
