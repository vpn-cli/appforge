"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PromptBox } from "@/components/dashboard/PromptBox";
import { AppCard } from "@/components/dashboard/AppCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { EmptyStateTemplates } from "@/components/dashboard/EmptyStateTemplates";
import { Button } from "@/components/ui/button";
import { createApp, deleteApp, renameApp } from "@/actions/apps";
import { Plus, Loader2, Sparkles, SlidersHorizontal } from "lucide-react";
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

  // Direction toggle: 'linear' (Direction 1) vs 'vercel' (Direction 2)
  const queryDirection = searchParams.get("direction");
  const [direction, setDirection] = useState<"linear" | "vercel">(() => {
    return queryDirection === "2" ? "vercel" : "linear";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [appToDelete, setAppToDelete] = useState<string | null>(null);

  // Filter apps based on search query
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return initialApps;
    const q = searchQuery.toLowerCase();
    return initialApps.filter((a) => a.name.toLowerCase().includes(q));
  }, [initialApps, searchQuery]);

  // Compute quiet stats line (no zero-value metrics)
  const statsLine = useMemo(() => {
    const total = initialApps.length;
    if (total === 0) return "0 apps";

    const published = initialApps.filter((a) => a.status === "Published").length;
    const drafts = initialApps.filter((a) => a.status !== "Published").length;

    const parts = [`${total} ${total === 1 ? "app" : "apps"}`];
    if (published > 0) parts.push(`${published} published`);
    if (drafts > 0) parts.push(`${drafts} draft`);

    return parts.join(" · ");
  }, [initialApps]);

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
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Direction Switcher (For two directions review) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Direction:
            </span>
            <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setDirection("linear")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  direction === "linear"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Linear Studio
              </button>
              <button
                type="button"
                onClick={() => setDirection("vercel")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  direction === "vercel"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Vercel Workspace
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlainCreate}
              disabled={isPending}
              className="h-7 text-xs border-border hover:bg-muted font-medium"
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Plus className="w-3 h-3 mr-1" />
              )}
              <span>New app</span>
            </Button>
          </div>
        </div>

        {/* Prompt-first Box */}
        <PromptBox
          variant={direction}
          onPlainCreate={handlePlainCreate}
          isPending={isPending}
        />

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main App Grid Section (Desktop: 8 or 9 cols) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
            {/* Page Title & Quiet Stats Line */}
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Apps
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                {statsLine}
              </p>
            </div>

            {/* Apps or Empty State */}
            {filteredApps.length === 0 && !searchQuery.trim() ? (
              <EmptyStateTemplates />
            ) : filteredApps.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg bg-card/20">
                <p className="text-sm text-muted-foreground">
                  No apps found matching &ldquo;{searchQuery}&rdquo;.
                </p>
              </div>
            ) : (
              <div
                className={`grid gap-5 sm:gap-6 ${
                  direction === "linear"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                }`}
              >
                {filteredApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    variant={direction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Activity Column (Desktop: right-hand column, Mobile: below grid) */}
          <div className="lg:col-span-4 xl:col-span-3 w-full">
            <div className="sticky top-20">
              <RecentActivity apps={initialApps} />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-semibold text-foreground mb-1.5">
              Delete application?
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              This will permanently delete this app and its configuration. This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAppToDelete(null)}
                disabled={isPending}
                className="text-xs h-8 border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                disabled={isPending}
                className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white min-w-[90px]"
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
