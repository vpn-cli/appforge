"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppThumbnail } from "@/components/dashboard/AppThumbnail";
import { MoreHorizontal, ExternalLink, Settings2, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import type { AppData } from "@/components/dashboard/AppGrid";

type Props = {
  app: AppData & {
    config?: unknown;
    published_config?: unknown;
  };
  onRename: (appId: string, currentName: string) => void;
  onDelete: (appId: string) => void;
  variant?: "linear" | "vercel";
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

export function AppCard({ app, onRename, onDelete, variant = "linear" }: Props) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isPublished = app.status === "Published";
  const appConfig = app.config || app.published_config;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is inside the overflow menu or button, don't navigate
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-navigate]")) return;

    router.push(`/builder/${app.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group cursor-pointer bg-card border border-border rounded-lg overflow-hidden transition-colors duration-150 flex flex-col relative select-none ${
        variant === "linear"
          ? "hover:border-foreground/40 shadow-none"
          : "hover:border-foreground/30 shadow-xs"
      }`}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/builder/${app.id}`);
        }
      }}
    >
      {/* 16:10 Live Thumbnail */}
      <AppThumbnail config={appConfig} />

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          {/* App title & metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-brand transition-colors">
                {app.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edited {formatRelativeTime(app.updated_at)}
            </p>
          </div>

          {/* Status Badge + Overflow menu */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 whitespace-nowrap ${
                isPublished
                  ? "bg-success-light text-success-text border border-success-border"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {isPublished && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
              <span>{app.status}</span>
            </span>

            {/* Overflow Menu Trigger */}
            <div className="relative" data-no-navigate>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-border"
                aria-label="App actions menu"
                aria-expanded={isMenuOpen}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

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
                    className="absolute right-0 top-full mt-1 w-44 rounded-md border border-border bg-card shadow-lg py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/builder/${app.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Open in builder</span>
                    </Link>

                    {isPublished && (
                      <Link
                        href={`/apps/${app.id}`}
                        className="flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted transition-colors"
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
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Rename</span>
                    </button>

                    <div className="my-1 border-t border-border/50" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(app.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete app</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
