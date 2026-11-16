"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Search, ChevronDown, Menu, X, LayoutGrid, FileCode2 } from "lucide-react";

type Props = {
  activeSearchQuery?: string;
  onSearchChange?: (q: string) => void;
};

export function AppHeader({ activeSearchQuery, onSearchChange }: Props) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAppsActive = pathname === "/dashboard" || pathname.startsWith("/apps");
  const isTemplatesActive = pathname === "/templates";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Left: Brand + Workspace + Nav */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md p-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center text-text-inverse shadow-sm transition-transform group-hover:scale-105">
              <AppForgeLogo size={16} isHovered={isHovered} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground hidden xs:inline-block">
              AppForge
            </span>
          </Link>

          <span className="text-muted-foreground/30 text-sm font-mono select-none">/</span>

          {/* Workspace identifier */}
          <div className="flex items-center">
            <div className="hidden sm:block">
              <OrganizationSwitcher
                hidePersonal={false}
                appearance={{
                  elements: {
                    organizationSwitcherTrigger:
                      "text-xs font-medium text-foreground hover:bg-muted/60 px-2 py-1 rounded-md border border-border/40 transition-colors flex items-center gap-1.5 h-7",
                    organizationPreviewTextContainer: "text-xs font-medium",
                  },
                }}
              />
            </div>
            <div className="sm:hidden flex items-center gap-1 text-xs font-medium text-foreground px-1.5 py-1 rounded bg-muted/40 border border-border/40">
              <span>Personal</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-2 border-l border-border/60 pl-3">
            <Link
              href="/dashboard"
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                isAppsActive
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Apps
            </Link>
            <Link
              href="/templates"
              className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                isTemplatesActive
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Templates
            </Link>
          </nav>
        </div>

        {/* Right: Search hint + Theme + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ⌘K Search hint */}
          <div className="relative hidden sm:flex items-center">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search apps..."
              value={activeSearchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-44 lg:w-56 h-7 pl-8 pr-9 text-xs bg-muted/40 hover:bg-muted/70 focus:bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
            />
            <kbd className="absolute right-2 text-[10px] font-mono text-muted-foreground/70 bg-background/80 border border-border/60 rounded px-1 py-0.2 select-none pointer-events-none">
              ⌘K
            </kbd>
          </div>

          <ThemeToggle />

          <div className="flex items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7 border border-border shadow-xs",
                  userButtonPopoverCard: "border border-border bg-card shadow-lg",
                },
              }}
            />
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-2 animate-in slide-in-from-top-1">
          <div className="relative flex items-center mb-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search apps..."
              value={activeSearchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-muted/40 border border-border rounded-md text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-xs font-medium px-2.5 py-2 rounded-md ${
              isAppsActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Apps</span>
          </Link>
          <Link
            href="/templates"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-xs font-medium px-2.5 py-2 rounded-md ${
              isTemplatesActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Templates</span>
          </Link>
        </div>
      )}
    </header>
  );
}
