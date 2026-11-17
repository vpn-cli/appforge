"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppThumbnail } from "@/components/dashboard/AppThumbnail";
import { MoreHorizontal, ExternalLink, Settings2, Edit3, Trash2 } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { IconButton } from "@/components/ui/icon-button";
import type { AppData } from "@/components/dashboard/AppGrid";

type Props = {
  app: AppData & {
    config?: unknown;
    published_config?: unknown;
  };
  onRename: (appId: string, currentName: string) => void;
  onDelete: (appId: string) => void;
};

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "Just now";
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export function AppCard({ app, onRename, onDelete }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userInitial = (user?.firstName?.[0] || user?.username?.[0] || "U").toUpperCase();

  const isPublished = app.status === "Published";
  const appConfig = app.config || app.published_config;

  const appSlug =
    (app as { slug?: string }).slug ||
    app.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  let pagesCount = 1;
  let entitiesCount = 2;
  try {
    const cfg = typeof appConfig === "string" ? JSON.parse(appConfig) : (appConfig as Record<string, unknown>);
    if (Array.isArray(cfg?.pages) && cfg.pages.length > 0) {
      pagesCount = cfg.pages.length;
    }
    if (Array.isArray(cfg?.entities) && cfg.entities.length > 0) {
      entitiesCount = cfg.entities.length;
    } else if (Array.isArray(cfg?.pages?.[0]?.components)) {
      const foundEntities = new Set<string>();
      for (const comp of cfg.pages[0].components) {
        if (comp && typeof comp === "object" && "entity" in comp) {
          foundEntities.add(String((comp as { entity: unknown }).entity));
        }
      }
      entitiesCount = Math.max(1, foundEntities.size || 2);
    }
  } catch {}

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is inside the overflow menu or button, don't navigate
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-navigate]")) return;

    router.push(`/builder/${app.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer rounded-2xl bg-card dark:bg-[#14141A] border border-border dark:border-white/10 hover:border-slate-400/50 dark:hover:border-white/20 overflow-hidden transition-all duration-200 flex flex-col relative select-none hover:-translate-y-0.5 hover:shadow-lg"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/builder/${app.id}`);
        }
      }}
    >
      {/* 16:10 Live Thumbnail with bottom fade mask */}
      <AppThumbnail config={appConfig} />

      {/* Card Body with consistent padding */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3.5">
        {/* Title row with Status Pill and Kebab on hover */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-[16px] sm:text-[17px] font-semibold text-foreground truncate tracking-tight transition-colors">
                {app.name}
              </h3>
              <StatusPill variant={isPublished ? "published" : "draft"}>
                {app.status}
              </StatusPill>
            </div>

            {/* Overflow Menu Trigger: Kebab on hover */}
            <div
              className={`relative shrink-0 transition-opacity duration-150 ${
                isMenuOpen
                  ? "opacity-100"
                  : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100"
              }`}
              data-no-navigate
            >
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                aria-label="App actions menu"
                aria-expanded={isMenuOpen}
                className="text-muted-foreground hover:text-foreground h-7 w-7"
              >
                <MoreHorizontal className="w-4 h-4" />
              </IconButton>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div
                    className="absolute right-0 bottom-full mb-1 w-44 rounded-2xl glass-1 border border-border dark:border-white/10 shadow-xl py-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/builder/${app.id}`}
                      className="flex items-center gap-2 px-3.5 py-1.5 text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Open in builder</span>
                    </Link>

                    {isPublished && (
                      <Link
                        href={`/apps/${app.id}`}
                        className="flex items-center gap-2 px-3.5 py-1.5 text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Run app</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRename(app.id, app.name);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Rename</span>
                    </button>

                    <div className="my-1 border-t border-border/50 dark:border-white/10" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(app.id);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-error-text hover:bg-error-light/50 transition-colors text-left cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete app</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* App slug in mono */}
          <p className="font-mono text-[12px] text-muted-foreground/80 tracking-tight truncate select-all">
            /apps/{appSlug}
          </p>
        </div>

        {/* Footer row: Page & entity counts, "edited by" avatar, relative time */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 dark:border-white/5 text-[12px] text-muted-foreground">
          {/* Page & entity counts */}
          <div className="flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground">
            <span>{pagesCount} {pagesCount === 1 ? "page" : "pages"}</span>
            <span className="text-border dark:text-white/20 select-none">·</span>
            <span>{entitiesCount} {entitiesCount === 1 ? "entity" : "entities"}</span>
          </div>

          {/* "Edited by" avatar + relative time */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-[9px] font-semibold flex items-center justify-center shrink-0 border border-slate-300/60 dark:border-white/10 shadow-2xs">
              {userInitial}
            </span>
            <span className="text-muted-foreground text-[12px]">
              {formatRelativeTime(app.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
