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
    <aside className="w-full rounded-2xl bg-card dark:bg-[#14141A] border border-border dark:border-white/10 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/50 dark:border-white/5">
        <h2 className="text-[17px] font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span>Recent activity</span>
        </h2>
        <span className="text-[13px] text-muted-foreground">
          {activities.length} {activities.length === 1 ? "event" : "events"}
        </span>
      </div>

      <div className="relative pl-3 space-y-4 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60 dark:before:bg-white/10">
        {activities.map((item, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            {/* Timeline node dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-card dark:border-[#14141A] ring-2 ring-background mt-1 shrink-0 z-10" />

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
