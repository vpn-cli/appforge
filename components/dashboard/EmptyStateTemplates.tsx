"use client";

import { useTransition } from "react";
import { AppThumbnail } from "@/components/dashboard/AppThumbnail";
import { Button } from "@/components/ui/button";
import { createAppFromTemplate } from "@/actions/apps";
import { ArrowRight, Loader2 } from "lucide-react";

const starterTemplates = [
  {
    id: "crm",
    name: "Analytics CRM & Pipeline",
    description: "Revenue metrics, conversion rates, and live customer opportunity table.",
    config: {
      app: "Analytics CRM",
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Enterprise Revenue CRM",
              subtitle: "Q3 Pipeline performance and accounts.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 3,
              gap: 4,
              items: [
                { type: "Statistic", label: "Pipeline Value", value: "$1.4M", trend: "up", trendValue: "+14%" },
                { type: "Statistic", label: "Win Rate", value: "28.4%", trend: "up", trendValue: "+2.1%" },
                { type: "Statistic", label: "Active Deals", value: "38" },
              ],
            },
            {
              type: "DataTable",
              entity: "opportunities",
              columns: [
                { key: "company", label: "Account", type: "text" },
                { key: "stage", label: "Stage", type: "badge" },
                { key: "value", label: "Value ($)", type: "number" },
              ],
              data: [
                { id: "1", company: "Starlight Media", stage: "Proposal", value: 45000 },
                { id: "2", company: "Cyberdyne Corp", stage: "Negotiation", value: 92000 },
                { id: "3", company: "Acme Cloud", stage: "Closed Won", value: 28000 },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "directory",
    name: "Team & Personnel Directory",
    description: "Corporate directory with team cards, departments, and roles.",
    config: {
      app: "Employee Directory",
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Engineering & Product Staff",
              subtitle: "Active personnel across all regions.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 3,
              gap: 4,
              items: [
                {
                  type: "Card",
                  title: "Sarah Chen",
                  subtitle: "Staff Infrastructure Engineer · SF",
                  footer: [{ type: "ButtonAction", label: "View Profile", variant: "outline" }],
                },
                {
                  type: "Card",
                  title: "Marcus Vance",
                  subtitle: "Principal Designer · London",
                  footer: [{ type: "ButtonAction", label: "View Profile", variant: "outline" }],
                },
                {
                  type: "Card",
                  title: "Elena Rostova",
                  subtitle: "Security Architect · Berlin",
                  footer: [{ type: "ButtonAction", label: "View Profile", variant: "outline" }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "blank",
    name: "Operations & Incident Hub",
    description: "System health alerts, telemetry cards, and diagnostics.",
    config: {
      app: "Operations Hub",
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Global Systems Operations",
              subtitle: "Fleet logistics and service health.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 3,
              gap: 4,
              items: [
                {
                  type: "Card",
                  title: "Cluster US-East",
                  subtitle: "100% healthy · 14 pods active",
                  footer: [{ type: "ButtonAction", label: "Telemetry", variant: "outline" }],
                },
                {
                  type: "Card",
                  title: "Cluster EU-Central",
                  subtitle: "99.8% uptime · 2 warning events",
                  footer: [{ type: "ButtonAction", label: "Inspect", variant: "outline" }],
                },
                {
                  type: "Card",
                  title: "Edge CDN",
                  subtitle: "Global routes operating nominal",
                  footer: [{ type: "ButtonAction", label: "Purge cache", variant: "outline" }],
                },
              ],
            },
          ],
        },
      ],
    },
  },
];

export function EmptyStateTemplates() {
  const [isPending, startTransition] = useTransition();

  const handleUseTemplate = (templateId: string) => {
    if (isPending) return;
    startTransition(() => {
      createAppFromTemplate(templateId);
    });
  };

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">
            Starter templates
          </h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            No applications yet. Select a starter layout or generate one with a prompt above.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {starterTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="group bg-card border border-border hover:border-border-strong rounded-lg overflow-hidden flex flex-col justify-between transition-colors"
          >
            <div>
              <AppThumbnail config={tpl.config} />

              <div className="p-4">
                <h3 className="text-[16px] font-semibold text-foreground transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">
                  {tpl.description}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <Button
                onClick={() => handleUseTemplate(tpl.id)}
                disabled={isPending}
                variant="secondary"
                size="md"
                className="w-full justify-between"
              >
                <span>{isPending ? "Creating app..." : "Use template"}</span>
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
