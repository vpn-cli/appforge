import {
  Database,
  ShieldAlert,
  Zap,
  Sparkles,
  Layers,
  Code,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { RenderNode } from "@/registry";

export function StorySection() {
  return (
    <section
      aria-labelledby="story-section-heading"
      className="w-full relative z-10 landing-features-band"
    >
      {/* 1. Section Header */}
      <div className="pt-[104px] sm:pt-[128px] pb-16 sm:pb-20 max-w-[1200px] mx-auto px-4 sm:px-6 w-full text-center">
        <h2
          id="story-section-heading"
          className="text-[34px] sm:text-[42px] lg:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-foreground select-none"
        >
          Instant Architecture. Zero Friction.
        </h2>
        <p className="text-[17px] sm:text-[18px] text-text-secondary max-w-[54ch] mx-auto text-center mt-3.5 font-normal leading-[1.6]">
          Runtime primitives that turn raw JSON metadata into resilient full-stack systems.
        </p>
      </div>

      {/* 2. Four Alternating Zig-Zag Feature Rows */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex flex-col gap-[96px] sm:gap-[112px] pb-[104px] sm:pb-[128px]">
        {/* Row 1: Dynamic Backends (Text 5/12 Left, Visual 7/12 Right) */}
        <div
          data-testid="story-row-backends"
          className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 w-full"
        >
          <div className="w-full lg:w-5/12 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-[12px] glass-2 flex items-center justify-center shrink-0 mb-5 text-brand-link shadow-xs">
              <Database className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <h3 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-foreground mb-3.5">
              Dynamic Backends
            </h3>
            <p className="text-[17px] leading-[1.65] text-text-secondary max-w-[46ch] font-normal">
              Instantly generated Postgres schemas and REST APIs based purely on your JSON entity
              definitions. AppForge inspects your frontend components and dynamically binds data
              endpoints before you even write a single line of backend logic.
            </p>
            <p className="mt-4 pt-3.5 border-t border-border font-mono text-[13px] leading-[1.55] text-muted-foreground max-w-[48ch]">
              Under the hood: execute_app_ddl RPC · whitelisted column types · RLS per table
            </p>
          </div>

          <div className="w-full lg:w-7/12">
            <div className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none">
              <div className="w-full max-w-[540px] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col gap-2.5 w-full sm:w-[210px] shrink-0">
                  {[
                    { name: "users", meta: "4 fields · id, role" },
                    { name: "projects", meta: "6 fields · org_id" },
                    { name: "workflows", meta: "3 fields · trigger" },
                  ].map((ent) => (
                    <div
                      key={ent.name}
                      className="glass-3 rounded-xl p-3 flex items-center justify-between border border-border"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center text-brand-link">
                          <Layers className="w-4 h-4" strokeWidth={1.8} />
                        </div>
                        <div>
                          <div className="text-[13px] font-mono font-semibold text-foreground">
                            {ent.name}
                          </div>
                          <div className="text-[12px] text-muted-foreground font-mono">
                            {ent.meta}
                          </div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-brand" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center shrink-0 text-brand-link">
                  <ArrowRight className="w-5 h-5 hidden sm:block" />
                  <ArrowDown className="w-5 h-5 sm:hidden" />
                </div>

                <div className="w-full sm:flex-1 min-w-0">
                  <div className="glass-3 rounded-2xl p-4 border border-border flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] font-semibold text-foreground">
                        app_ops_workflows
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-light text-brand-link border border-border">
                        RLS ON
                      </span>
                    </div>
                    <RenderNode
                      config={{
                        type: "DataTable",
                        columns: [
                          { key: "workflow", label: "Workflow", type: "text" },
                          { key: "status", label: "Status", type: "badge" },
                        ],
                        data: [
                          { workflow: "User Sync", status: "Active" },
                          { workflow: "Invoice Gen", status: "Pending" },
                          { workflow: "Slack Alerts", status: "Active" },
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Graceful Degradation (Visual 7/12 Left, Text 5/12 Right) */}
        <div
          data-testid="story-row-resilience"
          className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-14 w-full"
        >
          <div className="w-full lg:w-7/12">
            <div className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none">
              <div className="w-full max-w-[520px] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <RenderNode
                  config={{
                    type: "Statistic",
                    label: "Active Users",
                    value: "12,840",
                    trend: { value: "+14%", sentiment: "positive" },
                  }}
                />

                <div className="rounded-xl border border-error-border bg-error-light/60 p-3 flex flex-col justify-center min-w-0">
                  <RenderNode
                    config={{
                      type: "DataTable",
                      columns: "missing_columns_array",
                    }}
                  />
                </div>

                <RenderNode
                  config={{
                    type: "Statistic",
                    label: "Records Synced",
                    value: "4,312",
                    trend: { value: "+6%", sentiment: "positive" },
                  }}
                />

                <RenderNode
                  config={{
                    type: "Statistic",
                    label: "API Requests",
                    value: "98,420",
                    trend: { value: "+2.4%", sentiment: "positive" },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-5/12 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-[12px] glass-2 flex items-center justify-center shrink-0 mb-5 text-brand-link shadow-xs">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <h3 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-foreground mb-3.5">
              Graceful Degradation
            </h3>
            <p className="text-[17px] leading-[1.65] text-text-secondary max-w-[46ch] font-normal">
              Broken config? Missing fields? AppForge treats your UI like a microservices
              architecture. Instead of crashing the page, it isolates the specific rendering error
              with a localized Error Boundary so your layout remains interactive and functional.
            </p>
            <p className="mt-4 pt-3.5 border-t border-border font-mono text-[13px] leading-[1.55] text-muted-foreground max-w-[48ch]">
              Under the hood: per-node Zod schemas · InvalidNodeFallback
            </p>
          </div>
        </div>

        {/* Row 3: Instant Preview (Text 5/12 Left, Visual 7/12 Right) */}
        <div
          data-testid="story-row-preview"
          className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 w-full"
        >
          <div className="w-full lg:w-5/12 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-[12px] glass-2 flex items-center justify-center shrink-0 mb-5 text-brand-link shadow-xs">
              <Zap className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <h3 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-foreground mb-3.5">
              Instant Preview
            </h3>
            <p className="text-[17px] leading-[1.65] text-text-secondary max-w-[46ch] font-normal">
              Experience unparalleled developer velocity. The side-by-side builder interface
              monitors your JSON runtime in real-time, immediately validating schema structures and
              syncing layout mutations directly to the preview.
            </p>
            <p className="mt-4 pt-3.5 border-t border-border font-mono text-[13px] leading-[1.55] text-muted-foreground max-w-[48ch]">
              Under the hood: Monaco · validation on every edit
            </p>
          </div>

          <div className="w-full lg:w-7/12">
            <div className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none">
              <div className="w-full max-w-[540px] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5">
                <div className="glass-3 rounded-2xl p-4 w-full sm:w-[235px] border border-border font-mono text-[12px] leading-[1.7] shrink-0">
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
                    &nbsp;&nbsp;<span className="token-key">&quot;label&quot;</span>:{" "}
                    <span className="token-string">&quot;Revenue&quot;</span>,
                    <br />
                    &nbsp;&nbsp;<span className="token-key">&quot;value&quot;</span>:{" "}
                    <span className="token-string">&quot;$48,200&quot;</span>
                    <br />
                    <span className="token-bracket">&#125;</span>
                  </div>
                </div>

                <div className="flex items-center justify-center shrink-0 text-brand-link">
                  <ArrowRight className="w-4 h-4 hidden sm:block" />
                  <ArrowDown className="w-4 h-4 sm:hidden" />
                </div>

                <div className="w-full sm:flex-1 min-w-0">
                  <RenderNode
                    config={{
                      type: "Statistic",
                      label: "Revenue",
                      value: "$48,200",
                      trend: { value: "+18%", sentiment: "positive" },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: AI Copilot (Visual 7/12 Left, Text 5/12 Right) */}
        <div
          data-testid="story-row-copilot"
          className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-14 w-full"
        >
          <div className="w-full lg:w-7/12">
            <div className="glass-1 rounded-2xl p-5 sm:p-8 w-full min-h-[360px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden select-none">
              <div className="w-full max-w-[520px] flex flex-col gap-3.5">
                <div className="glass-3 rounded-xl p-3.5 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-brand-link shrink-0" />
                    <span className="text-[13px] text-foreground truncate">
                      &quot;Create an incident triage board with SLA metrics&quot;
                    </span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-light text-brand-link shrink-0">
                    Groq → Gemini
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RenderNode
                    config={{
                      type: "Statistic",
                      label: "Open Incidents",
                      value: "2",
                      trend: { value: "-3", sentiment: "positive" },
                    }}
                  />
                  <RenderNode
                    config={{
                      type: "Statistic",
                      label: "SLA Compliance",
                      value: "99.98%",
                      trend: { value: "+0.1%", sentiment: "positive" },
                    }}
                  />
                </div>

                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-[12px] font-mono text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-success-text">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    2/2 nodes validated
                  </span>
                  <span>Strict JSON AST</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-5/12 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-[12px] glass-2 flex items-center justify-center shrink-0 mb-5 text-brand-link shadow-xs">
              <Sparkles className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <h3 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.25] text-foreground mb-3.5">
              AI Copilot
            </h3>
            <p className="text-[17px] leading-[1.65] text-text-secondary max-w-[46ch] font-normal">
              Describe a dashboard, workflow tracker, or directory in plain English. Copilot
              streams structured JSON matching the component registry directly into your editor,
              never raw JSX.
            </p>
            <p className="mt-4 pt-3.5 border-t border-border font-mono text-[13px] leading-[1.55] text-muted-foreground max-w-[48ch]">
              Under the hood: Groq → Gemini failover before the first chunk · every node
              Zod-validated
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
