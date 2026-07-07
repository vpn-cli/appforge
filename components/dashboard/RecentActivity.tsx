import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function RecentActivity() {
  const activities = [
    { action: "Published", subject: "Internal CRM", time: "2 hours ago" },
    { action: "Saved", subject: "Inventory Tracker config.json", time: "5 hours ago" },
    { action: "Created", subject: "Employee Directory", time: "1 day ago" },
    { action: "Caught Error", subject: "Unknown Component 'Chart'", time: "2 days ago" },
  ];

  return (
    <Card className="bg-card border-border h-full shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold flex items-center text-foreground uppercase tracking-wider">
          <Activity className="w-4 h-4 mr-2 text-brand" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1 relative">
                <div className="w-2 h-2 rounded-full bg-brand shadow-[0_0_8px_rgba(108,87,164,0.6)]" />
                {i !== activities.length - 1 && (
                  <div className="absolute top-3 left-1 w-[1px] h-10 bg-border/50" />
                )}
              </div>
              <div className="flex-1 mt-[-2px]">
                <p className="text-sm text-foreground font-medium tracking-tight">
                  {item.action} <span className="font-normal text-muted-foreground">{item.subject}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

