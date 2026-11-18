import { Globe, FileEdit, Clock } from "lucide-react";
import type { AppData } from "./AppGrid";
import { formatRelativeTime } from "./AppCard";

export function RecentlyUpdated({ apps = [] }: { apps?: AppData[] }) {
  // Read real state and latest timestamps directly from the user's database records
  const recentApps = apps.slice(0, 5).map((app) => ({
    id: app.id,
    isPublished: app.status === "Published",
    status: app.status === "Published" ? "Published" : "Draft",
    name: app.name || "Untitled App",
    time: formatRelativeTime(app.updated_at),
  }));

  const hasApps = recentApps.length > 0;

  return (
    <aside className="w-full h-full rounded-2xl bg-card border border-border p-5 shadow-xs flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/50 dark:border-white/5 shrink-0">
        <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>Recently updated</span>
        </h2>
        <span className="text-[12px] font-medium text-muted-foreground">
          {hasApps ? `${recentApps.length} ${recentApps.length === 1 ? "app" : "apps"}` : "0 apps"}
        </span>
      </div>

      {!hasApps ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Clock className="w-4 h-4 opacity-60" />
          </div>
          <p className="text-[13px] font-medium text-foreground">No recently updated apps</p>
          <p className="text-[12px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
            Your recently created, edited, and published apps will appear here.
          </p>
        </div>
      ) : (
        <div className="relative pl-2.5 space-y-4.5 before:absolute before:left-[19px] before:top-2 before:bottom-3 before:w-[1px] before:bg-border/60 dark:before:bg-white/10 flex-1">
          {recentApps.map((item) => (
            <div key={item.id} className="flex items-start gap-3 relative">
              {/* Publication state indicator node */}
              <div
                className={`w-5 h-5 rounded-full border text-[10px] font-semibold flex items-center justify-center shrink-0 z-10 mt-0.5 shadow-2xs ${
                  item.isPublished
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                }`}
                title={item.isPublished ? "Published" : "Draft"}
              >
                {item.isPublished ? (
                  <Globe className="w-2.5 h-2.5" />
                ) : (
                  <FileEdit className="w-2.5 h-2.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground leading-snug truncate">
                  <span className="font-semibold text-foreground">{item.status}</span>{" "}
                  <span className="text-foreground/90 font-medium">{item.name}</span>
                </p>
                <span className="text-[12px] text-muted-foreground block mt-0.5">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

// Backward-compatible export
export const RecentActivity = RecentlyUpdated;
