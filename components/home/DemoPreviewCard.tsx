import { Layers } from "lucide-react";
import { RenderNode } from "@/registry";
import { StatusPill } from "@/components/ui/status-pill";
import { buildHeroDemoConfig, type HeroDemoStateParams } from "./heroDemoConfig";

type DemoPreviewCardProps = HeroDemoStateParams;

export function DemoPreviewCard({
  metricValue = 1244,
  invoiceStatus = "Idle",
  includeSlackAlerts = true,
  variant = "gradient",
}: DemoPreviewCardProps = {}) {
  const config = buildHeroDemoConfig({
    metricValue,
    invoiceStatus,
    includeSlackAlerts,
    variant,
  });
  const components = config.pages[0].components;

  return (
    <div
      data-testid="hero-preview-card"
      className="glass-1 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-auto lg:h-full transition-colors relative"
    >
      {/* Header — matching 44px (h-11) height with code card */}
      <div className="h-11 flex items-center justify-between gap-2 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 h-8">
          <div className="w-8 h-8 rounded-lg bg-brand-light border border-border flex items-center justify-center text-brand-link shrink-0">
            <Layers className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <h2 className="text-[13px] font-semibold tracking-wide uppercase text-foreground truncate">
            Rendered Application
          </h2>
        </div>

        <StatusPill variant="neutral" showDot={false} className="h-8 inline-flex items-center">
          Rendered from config
        </StatusPill>
      </div>

      {/* Real Registry Component Output — fits content height with no empty band above or below table */}
      <div className="py-3 flex flex-col gap-4 min-w-0">
        {components.map((node, idx) => (
          <RenderNode key={idx} config={node} />
        ))}
      </div>

      {/* Explicit Sample Data Disclosure — aligned to exact same baseline */}
      <div className="h-9 pt-2.5 border-t border-border text-[13px] text-muted-foreground flex items-center justify-between gap-2 shrink-0">
        <span>Sample data</span>
        <span className="font-mono whitespace-nowrap shrink-0">ComponentRegistry</span>
      </div>
    </div>
  );
}
