import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppWindow, Layers, AlertCircle, Zap } from "lucide-react";

export function StatsBar({ counts = { apps: 12, components: 14392, drafts: 3, published: 1244 } }: { counts?: { apps: number, components: number, drafts: number, published: number } }) {
  const stats = [
    {
      title: "Apps Created",
      value: counts.apps.toString(),
      change: "Total registered",
    },
    {
      title: "Components Rendered",
      value: counts.components.toLocaleString(),
      change: "Across all apps",
    },
    {
      title: "Drafts (Action Req)",
      value: counts.drafts.toString(),
      change: "Unpublished edits",
      highlight: counts.drafts > 0 ? "text-warning-text" : undefined,
    },
    {
      title: "Active Workflows",
      value: counts.published.toString(),
      change: "Live deployments",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between hover:border-border/80 transition-colors shadow-sm"
        >
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {stat.title}
          </div>
          <div className="my-2">
            <div className={`text-3xl font-bold font-mono tracking-tight ${stat.highlight || "text-foreground"}`}>
              {stat.value}
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}

