import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppWindow, Layers, AlertCircle, Zap } from "lucide-react";

export function StatsBar({ counts = { apps: 12, components: 14392, drafts: 3, published: 1244 } }: { counts?: { apps: number, components: number, drafts: number, published: number } }) {
  const stats = [
    {
      title: "Apps created",
      value: counts.apps.toString(),
      subtext: "Total registered",
    },
    {
      title: "Components rendered",
      value: counts.components.toLocaleString(),
      subtext: "Across all apps",
    },
    {
      title: "Drafts (Action req)",
      value: counts.drafts.toString(),
      subtext: "Unpublished edits",
      highlight: counts.drafts > 0 ? "text-warning-text" : undefined,
    },
    {
      title: "Active workflows",
      value: counts.published.toString(),
      subtext: "Live deployments",
    },
  ];

  return (
    <div className="w-full bg-card border border-border rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="p-4 sm:p-5 flex flex-col justify-between"
        >
          <div className="text-xs font-medium text-muted-foreground">
            {stat.title}
          </div>
          <div className="my-1.5">
            <div className={`text-2xl sm:text-3xl font-bold font-sans tabular-nums tracking-tight ${stat.highlight || "text-foreground"}`}>
              {stat.value}
            </div>
          </div>
          <div className="text-[12px] text-muted-foreground">
            {stat.subtext}
          </div>
        </div>
      ))}
    </div>
  );
}

