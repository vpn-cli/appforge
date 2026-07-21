import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppWindow, Layers, AlertCircle, Zap } from "lucide-react";

export function StatsBar({ counts = { apps: 12, components: 14392, drafts: 3, published: 1244 } }: { counts?: { apps: number, components: number, drafts: number, published: number } }) {
  const stats = [
    {
      title: "Apps Created",
      value: counts.apps.toString(),
      change: "Total registered",
      icon: <AppWindow className="h-4 w-4 text-brand" />,
    },
    {
      title: "Components Rendered",
      value: counts.components.toLocaleString(),
      change: "Across all apps",
      icon: <Layers className="h-4 w-4 text-[#FFBD2E]" />,
    },
    {
      title: "Drafts (Action Req)",
      value: counts.drafts.toString(),
      change: "Unpublished edits",
      icon: <AlertCircle className="h-4 w-4 text-[#FF5F56]" />,
    },
    {
      title: "Active Workflows",
      value: counts.published.toString(),
      change: "Live deployments",
      icon: <Zap className="h-4 w-4 text-[#27C93F]" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
      {stats.map((stat, i) => (
        <Card key={i} className="bg-card border-border hover:border-border/80 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="p-2 bg-muted rounded-md shadow-inner">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

