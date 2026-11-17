"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/layout/AppShell";
import { PromptBox } from "@/components/dashboard/PromptBox";
import { AppCard } from "@/components/dashboard/AppCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { EmptyStateTemplates } from "@/components/dashboard/EmptyStateTemplates";
import { Button } from "@/components/ui/button";
import { createApp, deleteApp, renameApp } from "@/actions/apps";
import { Plus, Loader2 } from "lucide-react";
import type { AppData } from "@/components/dashboard/AppGrid";

type AppWithConfig = AppData & {
  config?: unknown;
  published_config?: unknown;
};

type Props = {
  initialApps: AppWithConfig[];
};

export function DashboardView({ initialApps }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeQuery = searchParams.get("theme");
  const { setTheme } = useTheme();

  useEffect(() => {
    if (themeQuery === "dark" || themeQuery === "light") {
      setTheme(themeQuery);
    }
  }, [themeQuery, setTheme]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [appToDelete, setAppToDelete] = useState<string | null>(null);

  // Filter apps based on search query
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return initialApps;
    const q = searchQuery.toLowerCase();
    return initialApps.filter((a) => a.name.toLowerCase().includes(q));
  }, [initialApps, searchQuery]);

  // Stats counts
  const totalApps = initialApps.length;
  const publishedCount = initialApps.filter((a) => a.status === "Published").length;
  const draftsCount = initialApps.filter((a) => a.status !== "Published").length;

  const handlePlainCreate = () => {
    if (isPending) return;
    startTransition(async () => {
      try {
        await createApp();
      } catch {
        router.push("/builder/mock-new-id");
      }
    });
  };

  const handleRename = (appId: string, currentName: string) => {
    const newName = window.prompt("Enter new application name:", currentName);
    if (!newName || newName === currentName) return;

    startTransition(async () => {
      try {
        await renameApp(appId, newName);
        router.refresh();
      } catch (err) {
        alert(String(err));
      }
    });
  };

  const handleDelete = (appId: string) => {
    setAppToDelete(appId);
  };

  const confirmDelete = () => {
    if (!appToDelete) return;

    startTransition(async () => {
      try {
        await deleteApp(appToDelete);
        setAppToDelete(null);
        router.refresh();
      } catch (err) {
        alert(String(err));
        setAppToDelete(null);
      }
    });
  };

  return (
    <AppShell activeSearchQuery={searchQuery} onSearchChange={setSearchQuery}>
      <div className="w-full max-w-[1200px] mx-auto px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Page Title Row: Title + Inline Stat Chips on left, "New app" primary button aligned to h1 baseline */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-1">
          <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
            <h1 className="text-[32px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
              Apps
            </h1>
            {/* Inline stat chips: 2 apps · 1 published · 1 draft */}
            <div className="inline-flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 text-foreground">
                {totalApps} {totalApps === 1 ? "app" : "apps"}
              </span>
              {publishedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {publishedCount} published
                </span>
              )}
              {draftsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-200/50 dark:bg-white/5 text-muted-foreground border border-slate-300/40 dark:border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                  {draftsCount} draft
                </span>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handlePlainCreate}
            disabled={isPending}
            className="shrink-0 self-start sm:self-auto"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>New app</span>
          </Button>
        </div>

        {/* Prompt-first Composer */}
        <PromptBox
          onPlainCreate={handlePlainCreate}
          isPending={isPending}
          appCount={initialApps.length}
        />

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Main App Grid Section (Desktop: 8 or 9 cols) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
            {/* Apps or Empty State */}
            {filteredApps.length === 0 && !searchQuery.trim() ? (
              <EmptyStateTemplates />
            ) : filteredApps.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg bg-card/20">
                <p className="text-[13px] text-muted-foreground">
                  No apps found matching &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {filteredApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Activity Column (Desktop: right-hand column matching grid top & height, Mobile: below grid) */}
          <div className="lg:col-span-4 xl:col-span-3 w-full h-full flex flex-col">
            <RecentActivity apps={initialApps} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card dark:bg-[#14141A] border border-border dark:border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-[17px] font-semibold text-foreground mb-1.5">
              Delete application?
            </h2>
            <p className="text-[13px] text-muted-foreground mb-5">
              This will permanently delete this app and its configuration. This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setAppToDelete(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={confirmDelete}
                disabled={isPending}
                className="min-w-[90px]"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
