"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppThumbnail } from "@/components/dashboard/AppThumbnail";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { createAppFromTemplate } from "@/actions/apps";
import { ArrowRight, Eye } from "lucide-react";

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: "Operations" | "Organization" | "Scratch";
  componentsCount: number;
  entitiesCount: number;
  config: Record<string, unknown>;
}

const TEMPLATES_DATA: TemplateItem[] = [
  {
    id: "crm",
    title: "Analytics CRM",
    description: "Pipeline metrics, conversion rates, and searchable lead table.",
    category: "Operations",
    componentsCount: 6,
    entitiesCount: 2,
    config: {
      app: "Analytics CRM",
      entities: {
        leads: { company: "string", contact: "string", value: "number", status: "string" },
        activities: { lead_id: "string", type: "string", date: "string" },
      },
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Sales Analytics CRM",
              subtitle: "Q3 Performance Metrics and Pipeline",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 4,
              gap: 3,
              items: [
                { type: "Statistic", label: "Total Pipeline", value: "$1.2M", trend: { value: "+18%", sentiment: "positive" } },
                { type: "Statistic", label: "Active Leads", value: "84", trend: { value: "-5%", sentiment: "neutral" } },
                { type: "Statistic", label: "Conversion Rate", value: "12.5%", trend: { value: "+2.1%", sentiment: "positive" } },
                { type: "Statistic", label: "Closed Won", value: "42 Deals" },
              ],
            },
            { type: "Header", title: "Recent Opportunities", size: "md" },
            {
              type: "DataTable",
              entity: "leads",
              columns: [
                { key: "company", label: "Company", type: "text" },
                { key: "contact", label: "Contact", type: "text" },
                { key: "value", label: "Value ($)", type: "currency" },
                { key: "status", label: "Status", type: "badge" },
              ],
              data: [
                { company: "Acme Cloud", contact: "Jane Doe", value: 48000, status: "Active" },
                { company: "Nexus AI", contact: "Mark Vance", value: 72000, status: "Pending" },
                { company: "HyperScale", contact: "Sarah Lin", value: 31000, status: "Active" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "incident",
    title: "Incident Command Center",
    description: "Real-time service degradation alerts, active remediation runs, and edge latency telemetry.",
    category: "Operations",
    componentsCount: 6,
    entitiesCount: 1,
    config: {
      app: "Incident Command Center",
      entities: {
        incidents: { id: "string", service: "string", severity: "string", status: "string", impact: "number" },
      },
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Incident Command Center",
              subtitle: "Real-time service degradation alerts and edge latency.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 4,
              gap: 3,
              items: [
                { type: "Statistic", label: "Active Incidents", value: "2", trend: { value: "-3", sentiment: "positive" } },
                { type: "Statistic", label: "MTTR", value: "14m", trend: { value: "-4m", sentiment: "positive" } },
                { type: "Statistic", label: "Degraded Services", value: "1", trend: { value: "+1", sentiment: "negative" } },
                { type: "Statistic", label: "Global Uptime", value: "99.98%" },
              ],
            },
            {
              type: "DataTable",
              columns: [
                { key: "id", label: "Incident ID", type: "id" },
                { key: "service", label: "Service", type: "text" },
                { key: "severity", label: "Severity", type: "badge" },
                { key: "status", label: "Status", type: "badge" },
              ],
              data: [
                { id: "INC-4091", service: "API Gateway Ingress", severity: "Critical", status: "Active" },
                { id: "INC-4092", service: "Auth0 Token Relay", severity: "Warning", status: "Pending" },
                { id: "INC-4089", service: "Postgres Read Replica", severity: "Minor", status: "Resolved" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "directory",
    title: "Employee Directory",
    description: "Corporate directory with team cards, roles, and quick profiles.",
    category: "Organization",
    componentsCount: 5,
    entitiesCount: 1,
    config: {
      app: "Employee Directory",
      entities: {
        employees: { name: "string", role: "string", department: "string", email: "string" },
      },
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Employee Directory",
              subtitle: "Search and manage personnel globally.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 3,
              gap: 3,
              items: [
                { type: "Statistic", label: "Total Headcount", value: "142", trend: { value: "+12%", sentiment: "positive" } },
                { type: "Statistic", label: "Departments", value: "8" },
                { type: "Statistic", label: "Open Roles", value: "24", trend: { value: "+4", sentiment: "positive" } },
              ],
            },
            {
              type: "DataTable",
              entity: "employees",
              columns: [
                { key: "name", label: "Employee", type: "avatar" },
                { key: "role", label: "Role", type: "text" },
                { key: "department", label: "Department", type: "badge" },
                { key: "email", label: "Email", type: "code" },
              ],
              data: [
                { name: "Sarah Jenkins", role: "Product Lead", department: "Design", email: "s.jenkins@co.internal" },
                { name: "Alex Thorne", role: "Staff Engineer", department: "Core Infra", email: "a.thorne@co.internal" },
                { name: "Elena Rostova", role: "VP Growth", department: "Revenue", email: "e.rostova@co.internal" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "blank",
    title: "Blank Canvas",
    description: "Start from a clean slate and build with JSON or the Gemini Copilot.",
    category: "Scratch",
    componentsCount: 2,
    entitiesCount: 0,
    config: {
      app: "Blank Canvas",
      entities: {},
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Blank Canvas",
              subtitle: "Start from a clean slate and build with JSON or Copilot.",
              size: "lg",
            },
            {
              type: "Card",
              title: "Empty Workspace",
              subtitle: "Prompt Copilot or configure data structures in the JSON editor.",
            },
          ],
        },
      ],
    },
  },
];

const CATEGORIES = ["All", "Operations", "Organization", "Scratch"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

export function TemplatesView() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") return TEMPLATES_DATA;
    return TEMPLATES_DATA.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 select-none">
      {/* Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
            Templates
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Starter configurations to jumpstart your internal tools.
          </p>
        </div>

        {/* Category filter pills: All / Operations / Organization / Scratch */}
        <div
          role="tablist"
          aria-label="Filter templates by category"
          className="inline-flex items-center p-1 rounded-full bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 self-start sm:self-auto"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-surface text-brand-link shadow-[0_2px_8px_rgba(23,23,31,0.08)] dark:bg-white/[0.14] font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Templates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="group rounded-2xl bg-card border border-border/80 dark:border-white/10 hover:border-slate-400/50 dark:hover:border-white/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between"
          >
            {/* Live cropped thumbnail at top with bottom fade */}
            <AppThumbnail config={tpl.config} />

            {/* Below Thumbnail Body */}
            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
              <div>
                {/* Category tag pill */}
                <div className="flex items-center justify-between mb-2.5">
                  <StatusPill variant="neutral" showDot={false}>
                    {tpl.category}
                  </StatusPill>
                </div>

                {/* Title: 17/600 */}
                <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
                  {tpl.title}
                </h3>

                {/* Description: 14 */}
                <p className="text-[14px] text-muted-foreground mt-1.5 leading-normal">
                  {tpl.description}
                </p>

                {/* Meta: muted 13 */}
                <p className="text-[13px] text-muted-foreground/80 mt-2.5 font-normal">
                  {tpl.componentsCount} components · {tpl.entitiesCount} {tpl.entitiesCount === 1 ? "entity" : "entities"}
                </p>
              </div>

              {/* Actions row: Preview (secondary sm) + Use template (primary sm) on ONE row */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-border/60 dark:border-white/5 mt-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  render={<Link href={`/builder/demo?template=${tpl.id}`} />}
                  className="flex-1 justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Button>

                <form
                  action={createAppFromTemplate.bind(null, tpl.id)}
                  className="flex-1"
                >
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full justify-center gap-1.5"
                  >
                    <span>Use template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
