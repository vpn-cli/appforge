"use client";

import { notFound } from "next/navigation";
import { DataTable } from "@/registry/components/DataTable";
import { Grid } from "@/registry/components/Grid";
import { Card } from "@/registry/components/Card";
import { ButtonAction } from "@/registry/components/ButtonAction";

const sampleColumns = [
  { key: "id", label: "Invoice ID", type: "id" as const },
  { key: "customer", label: "Customer", type: "text" as const },
  { key: "amount", label: "Amount ($)", type: "number" as const },
  { key: "status", label: "Status", type: "badge" as const },
];

const sampleData = [
  { id: "INV-0091", customer: "Acme Logistics", amount: 14250, status: "Published" },
  { id: "INV-0092", customer: "Starlight Media", amount: 3800, status: "Pending" },
  { id: "INV-0093", customer: "Helix Robotics", amount: 29400, status: "Active" },
  { id: "INV-0094", customer: "Vanguard Tech", amount: 8120, status: "Failed" },
];

export default function TestRenderersPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col gap-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight mb-1">Renderer States Verification</h1>
        <p className="text-xs text-muted-foreground">AppForge design-taste-frontend renderer compliance test</p>
      </div>

      {/* State 1: Loading Skeleton */}
      <section id="state-loading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">1. Loading Skeleton State</h2>
          <span className="text-[11px] font-mono text-muted-foreground">state=&quot;loading&quot;</span>
        </div>
        <DataTable columns={sampleColumns} state="loading" />
      </section>

      {/* State 2: Loaded */}
      <section id="state-loaded" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">2. Loaded State (Right-aligned numbers, monospaced IDs, badges)</h2>
          <span className="text-[11px] font-mono text-muted-foreground">state=&quot;loaded&quot;</span>
        </div>
        <DataTable columns={sampleColumns} data={sampleData} state="loaded" isInteractive={true} />
      </section>

      {/* State 3: Empty */}
      <section id="state-empty" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">3. Empty State (Preserves headers & frame)</h2>
          <span className="text-[11px] font-mono text-muted-foreground">state=&quot;empty&quot;</span>
        </div>
        <DataTable columns={sampleColumns} data={[]} state="empty" />
      </section>

      {/* State 4: Scoped Error */}
      <section id="state-error" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">4. Scoped Error State (Contained within frame)</h2>
          <span className="text-[11px] font-mono text-muted-foreground">state=&quot;error&quot;</span>
        </div>
        <DataTable
          columns={sampleColumns}
          state="error"
          errorMessage="PostgreSQL replica timeout (504 Gateway). Check upstream connection."
        />
      </section>

      {/* State 5: Degraded */}
      <section id="state-degraded" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">5. Degraded State (Cached data with status banner)</h2>
          <span className="text-[11px] font-mono text-muted-foreground">state=&quot;degraded&quot;</span>
        </div>
        <DataTable
          columns={sampleColumns}
          data={sampleData.slice(0, 2)}
          state="degraded"
          degradedMessage="Showing cached snapshot · Reconnecting to telemetry cluster..."
        />
      </section>

      {/* Grid Component Test */}
      <section id="grid-system" className="flex flex-col gap-3 pt-6 border-t border-border">
        <h2 className="text-sm font-semibold">Grid System (gap-4, items-stretch, responsive)</h2>
        <Grid columns={3} gap={4} items={[
          { type: "Card", title: "Project Alpha", subtitle: "Active deployment", content: [{ type: "ButtonAction", label: "Open Run", variant: "default" }] },
          { type: "Card", title: "Project Beta", subtitle: "Staging build", content: [{ type: "ButtonAction", label: "View Logs", variant: "outline" }] },
          { type: "Card", title: "Project Gamma", subtitle: "Paused instance", content: [{ type: "ButtonAction", label: "Restart", variant: "secondary" }] },
        ]} />
      </section>
    </div>
  );
}
