import { Activity } from "lucide-react";
import type { AppData } from "./AppGrid";
import { formatRelativeTime } from "./AppCard";

export function RecentActivity({ apps = [] }: { apps?: AppData[] }) {
  const activities = apps.slice(0, 5).map((app) => ({
    action: app.status === "Published" ? "Published" : "Saved draft for",
    subject: app.name || "Untitled App",
    time: formatRelativeTime(app.updated_at),
  }));

  if (activities.length === 0) {
    activities.push({
      action: "Initialized",
      subject: "workspace environment",
      time: "Just now",
    });
  }

  return (
    <aside className="w-full bg-card border border-border rounded-lg p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/50">
        <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span>Recent activity</span>
        </h2>
        <span className="text-[13px] text-muted-foreground">
          {activities.length} {activities.length === 1 ? "event" : "events"}
        </span>
      </div>

      <div className="relative pl-3 space-y-4 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
        {activities.map((item, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            {/* Timeline node */}
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 border border-card ring-2 ring-background mt-1.5 shrink-0 z-10" />

            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground font-medium truncate">
                <span className="text-muted-foreground">{item.action} </span>
                <span className="text-foreground">{item.subject}</span>
              </p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
