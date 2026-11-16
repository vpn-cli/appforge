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
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand + Workspace + Nav */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md py-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-foreground transition-transform group-hover:scale-105 shrink-0">
              <AppForgeLogo size={18} isHovered={isHovered} className="text-foreground" />
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
                      "text-sm font-medium text-foreground hover:bg-muted px-2.5 py-1 rounded-md border border-border transition-colors flex items-center gap-1.5 h-9",
                    organizationPreviewTextContainer: "text-sm font-medium text-foreground",
                    organizationPreviewMainIdentifier: "text-sm font-medium text-foreground",
                    organizationPreviewSecondaryIdentifier: "text-[13px] text-muted-foreground",
                    organizationSwitcherTriggerIcon: "text-muted-foreground",
                  },
                }}
                fallback={
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground px-2.5 py-1 rounded-md bg-muted border border-border h-9">
                    <span>Acme Corp</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                }
              />
            </div>
            <div className="sm:hidden flex items-center gap-1.5 text-sm font-medium text-foreground px-2 py-1 rounded bg-muted border border-border h-9">
              <span>Acme Corp</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-2 border-l border-border pl-3">
            <Link
              href="/dashboard"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                isAppsActive
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              Apps
            </Link>
            <Link
              href="/templates"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                isTemplatesActive
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search apps..."
              value={activeSearchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-44 lg:w-56 h-9 pl-9 pr-9 text-sm bg-muted/40 hover:bg-muted/70 focus:bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-border-strong transition-all"
            />
            <kbd className="absolute right-2 text-[11px] font-mono text-muted-foreground bg-background/80 border border-border rounded px-1.5 py-0.5 select-none pointer-events-none">
              ⌘K
            </kbd>
          </div>

          <ThemeToggle />

          <div className="flex items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border border-border",
                  userButtonPopoverCard: "border border-border bg-card shadow-lg text-foreground",
                },
              }}
            />
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-2 animate-in slide-in-from-top-1">
          <div className="relative flex items-center mb-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search apps..."
              value={activeSearchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-muted/40 border border-border rounded-md text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md ${
              isAppsActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Apps</span>
          </Link>
          <Link
            href="/templates"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md ${
              isTemplatesActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Templates</span>
          </Link>
        </div>
      )}
    </header>
  );
}
