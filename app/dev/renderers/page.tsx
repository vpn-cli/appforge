"use client";

import { useEffect, Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Header } from "@/registry/components/Header";
import { Grid } from "@/registry/components/Grid";
import { Card } from "@/registry/components/Card";
import { Statistic } from "@/registry/components/Statistic";
import { DataTable } from "@/registry/components/DataTable";
import { ButtonAction } from "@/registry/components/ButtonAction";
import { Lock } from "lucide-react";

function DevRenderersContent() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { setTheme } = useTheme();
  const searchParams = useSearchParams();

  useEffect(() => {
    const themeParam = searchParams.get("theme");
    if (themeParam === "light" || themeParam === "dark") {
      setTheme(themeParam);
    }
  }, [searchParams, setTheme]);

  const stressColumns = [
    { key: "id", label: "Incident ID", type: "id" as const },
    { key: "title", label: "Incident Description", type: "text" as const },
    { key: "service", label: "Microservice Component", type: "text" as const },
    { key: "impact", label: "Impact ($)", type: "currency" as const },
    { key: "status", label: "Remediation Status", type: "badge" as const },
    { key: "owner", label: "Commander", type: "text" as const },
  ];

  const stressData = [
    {
      id: "INC-89201",
      title: "Global DNS Resolution Timeout on Edge Ingress Anycast Gateway Proxy Cluster",
      service: "ingress-anycast-us-east-1a",
      impact: 142500,
      status: "Critical",
      owner: "Sarah Chen",
    },
    {
      id: "INC-89202",
      title: "Elevated 504 Gateway Timeouts During Database Failover Replication Lag",
      service: "postgres-primary-read-replica",
      impact: 48900,
      status: "Investigating",
      owner: "Elena Rostova",
    },
    {
      id: "INC-89203",
      title: "Memory leak detected in streaming worker process cluster after node upgrade",
      service: "streaming-worker-pool-eu",
      impact: 12000,
      status: "Degraded",
      owner: "Marcus Vance",
    },
    {
      id: "INC-89204",
      title: "Scheduled security compliance certificate rotation across TLS termination layer",
      service: "tls-cert-manager-daemon",
      impact: 0,
      status: "Resolved",
      owner: "Alex Mercer",
    },
    {
      id: "INC-89205",
      title: "Automated container heal and health check probe across worker group",
      service: "k8s-pod-rebalancer",
      impact: 0,
      status: "Operational",
      owner: "Remediation Bot",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-2 sm:p-4 flex flex-col items-center">
      {/* Preview Frame Wrapper */}
      <div className="w-full max-w-full flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-300">
        {/* Browser Chrome Toolbar */}
        <div className="h-9 px-3.5 bg-muted/30 border-b border-border flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5 w-16">
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-background/80 border border-border/80 rounded-md text-[11px] text-muted-foreground font-mono max-w-[280px] w-full justify-center">
            <Lock className="w-2.5 h-2.5 text-muted-foreground/70" />
            <span className="truncate">localhost:3000/dev/renderers</span>
          </div>
          <div className="w-16 text-right text-[10px] font-mono text-muted-foreground">
            TEST_SUITE
          </div>
        </div>

        {/* Viewport Content Area with @container */}
        <div className="@container flex-1 overflow-y-auto p-4 @sm:p-6 bg-card min-w-0 flex flex-col gap-8">
          {/* 1. Stress Header (Extremely long titles, subtitles, and unbroken words) */}
          <section className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Stress Fixture 1: Long Header & Value Wrapping
            </span>
            <Header
              title="Global Distributed Telemetry Operations and Incident Response Command Center for Enterprise Kubernetes Infrastructure"
              subtitle="Real-time multi-region latency telemetry, automated circuit-breaker enforcement, zero-trust perimeter auditing, and high-velocity continuous deployment pipelines across 48 global availability zones with automated fallback routing."
              size="lg"
            />
          </section>

          {/* 2. Empty Values Stress Fixture */}
          <section className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Stress Fixture 2: Empty Values & Edge Cases
            </span>
            <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4 min-w-0">
              <Statistic label="" value="" />
              <Statistic label="Missing Value Stat" value="—" />
              <Card title="" subtitle="" content={[]} />
            </div>
          </section>

          {/* 3. 8 KPIs in a row in a Grid */}
          <section className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Stress Fixture 3: 8 KPIs in Adaptive Grid
            </span>
            <Grid
              columns={8}
              gap={3}
              items={[
                {
                  type: "Statistic",
                  label: "Total ARR Pipeline",
                  value: "$148,290,400",
                  trend: { value: "+14.2%", sentiment: "positive" },
                },
                {
                  type: "Statistic",
                  label: "Churn Probability",
                  value: "1.4%",
                  trend: { value: "-0.8%", sentiment: "positive" },
                },
                {
                  type: "Statistic",
                  label: "Incident Volume",
                  value: "42",
                  trend: { value: "+18", sentiment: "negative" },
                },
                {
                  type: "Statistic",
                  label: "Edge Request Latency",
                  value: "14.2ms",
                  trend: { value: "0.0ms", sentiment: "neutral" },
                },
                {
                  type: "Statistic",
                  label: "Worker Saturation",
                  value: "88.4%",
                  trend: { value: "+5.1%", sentiment: "negative" },
                },
                {
                  type: "Statistic",
                  label: "Database Cache Hit",
                  value: "99.82%",
                  trend: { value: "+0.4%", sentiment: "positive" },
                },
                {
                  type: "Statistic",
                  label: "Active Ingress Sessions",
                  value: "1,492,021",
                  trend: { value: "+88.4K", sentiment: "positive" },
                },
                {
                  type: "Statistic",
                  label: "Failed Auth Attempts",
                  value: "3",
                  trend: { value: "-12", sentiment: "positive" },
                },
              ]}
            />
          </section>

          {/* 4. Statistic inside Card inside Grid (No Nested Frames Hairline Divider Rule) */}
          <section className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Stress Fixture 4: Statistic inside Card inside Grid (Hairline Dividers, Borderless)
            </span>
            <Grid
              columns={2}
              gap={4}
              items={[
                {
                  type: "Card",
                  title: "Cluster Resource Allocation",
                  subtitle: "Current compute distribution across AWS us-east-1 and eu-central-1",
                  content: [
                    {
                      type: "Statistic",
                      label: "CPU Allocation Limit",
                      value: "74%",
                      trend: { value: "+2%", sentiment: "neutral" },
                    },
                    {
                      type: "Statistic",
                      label: "Memory Allocation",
                      value: "61%",
                      trend: { value: "-4%", sentiment: "neutral" },
                    },
                    {
                      type: "Statistic",
                      label: "IOPS Peak Throughput",
                      value: "12.4K",
                      trend: { value: "+1.2K", sentiment: "neutral" },
                    },
                  ],
                  footer: [
                    { type: "ButtonAction", label: "Scale Nodes", variant: "default" },
                    { type: "ButtonAction", label: "View Metrics", variant: "outline" },
                  ],
                },
                {
                  type: "Card",
                  title: "Security & Compliance Posture",
                  subtitle: "Automated vulnerability audit passes for SOC2 Type II compliance",
                  content: [
                    {
                      type: "Statistic",
                      label: "Open CVE Vulnerabilities",
                      value: "0",
                      trend: { value: "Clean", sentiment: "positive" },
                    },
                    {
                      type: "Statistic",
                      label: "Automated Audit Pass Rate",
                      value: "100%",
                      trend: { value: "0%", sentiment: "positive" },
                    },
                    {
                      type: "Statistic",
                      label: "Audit Age Recency",
                      value: "2h ago",
                    },
                  ],
                  footer: [
                    { type: "ButtonAction", label: "Download Audit Log", variant: "outline" },
                  ],
                },
              ]}
            />
          </section>

          {/* 5. Extreme Long Unbroken Strings & Button Wrapping */}
          <section className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Stress Fixture 5: Extreme Unbroken Strings & Button Overflow
            </span>
            <Grid
              columns={2}
              gap={4}
              items={[
                {
                  type: "Statistic",
                  label:
                    "UnbrokenExtremelyLongIdentifierLabelWithoutAnySpacesToTestWordBreakBehaviorInStatistic",
                  value: "999,999,999,999,999.00",
                  trend: {
                    value: "+999.9% ExtremelyLongTrendDescription",
                    sentiment: "negative",
                  },
                },
                {
                  type: "Card",
                  title:
                    "CardWithUnbrokenExtremelyLongTitleStringWithoutSpacesToVerifyContainerNoOverflowGuarantee",
                  subtitle:
                    "CardSubtitleWithSuperLongUnbrokenStringLikeThisOneHereToMakeSureItWrapsGracefullyWithoutBleedingThroughTheBorder",
                  footer: [
                    {
                      type: "ButtonAction",
                      label:
                        "ExcessivelyLongButtonActionLabelThatCouldPotentiallyCauseOverflowOnMobileScreens",
                      variant: "outline",
                    },
                  ],
                },
              ]}
            />
          </section>

          {/* 6. Responsive Long DataTable with Status Badges and Currency */}
          <section className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Stress Fixture 6: Responsive DataTable with Badges & Currency
            </span>
            <DataTable
              columns={stressColumns}
              data={stressData}
              state="loaded"
              isInteractive={true}
            />
          </section>

          {/* 7. Empty State DataTable */}
          <section className="flex flex-col gap-2 pb-8 min-w-0">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Stress Fixture 7: Empty DataTable State
            </span>
            <DataTable
              columns={[
                { key: "id", label: "Archive ID", type: "id" },
                { key: "name", label: "Policy Name", type: "text" },
                { key: "status", label: "Compliance State", type: "badge" },
              ]}
              data={[]}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export default function DevRenderersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading stress fixtures...</div>}>
      <DevRenderersContent />
    </Suspense>
  );
}
