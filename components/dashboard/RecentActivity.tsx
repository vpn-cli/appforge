import { Activity } from "lucide-react";
import type { AppData } from "./AppGrid";
import { formatRelativeTime } from "./AppCard";

export function RecentActivity({ apps = [] }: { apps?: AppData[] }) {
  const activities = apps.slice(0, 5).map((app, idx) => ({
    userInitial: idx === 0 ? "V" : idx === 1 ? "V" : "A",
    action: app.status === "Published" ? "Published" : "Saved draft for",
    subject: app.name || "Untitled App",
    time: formatRelativeTime(app.updated_at),
  }));

  if (activities.length === 0) {
    activities.push({
      userInitial: "V",
      action: "Initialized",
      subject: "workspace environment",
      time: "Just now",
    });
  }

  return (
    <aside className="w-full h-full rounded-2xl bg-card dark:bg-[#14141A] border border-border dark:border-white/10 p-5 shadow-xs flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/50 dark:border-white/5 shrink-0">
        <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span>Recent activity</span>
        </h2>
        <span className="text-[12px] font-medium text-muted-foreground">
          {activities.length} {activities.length === 1 ? "event" : "events"}
        </span>
      </div>

      <div className="relative pl-2.5 space-y-4.5 before:absolute before:left-[19px] before:top-2 before:bottom-3 before:w-[1px] before:bg-border/60 dark:before:bg-white/10 flex-1">
        {activities.map((item, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            {/* Timeline avatar node */}
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 text-[10px] font-semibold flex items-center justify-center shrink-0 z-10 mt-0.5 shadow-2xs">
              {item.userInitial}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground leading-snug">
                <span className="font-semibold text-foreground">{item.action}</span>{" "}
                <span className="text-foreground/90">{item.subject}</span>
              </p>
              <span className="text-[12px] text-muted-foreground block mt-0.5">
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
