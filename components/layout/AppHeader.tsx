"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserButton, useOrganization, useUser } from "@clerk/nextjs";
import { Search, ChevronDown, Menu, X, LayoutGrid, FileCode2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { motion } from "motion/react";
import { MOTION_TOKENS } from "@/lib/motion-tokens";

type Props = {
  activeSearchQuery?: string;
  onSearchChange?: (q: string) => void;
};

export function AppHeader({ activeSearchQuery, onSearchChange }: Props) {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user } = useUser();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const orgName =
    organization?.name ||
    (user?.fullName ? `${user.fullName}'s Workspace` : "Vipin's Workspace");
  const orgInitial = (orgName?.[0] || "V").toUpperCase();

  const isAppsActive = pathname === "/apps" || (pathname.startsWith("/apps") && !pathname.startsWith("/apps/template")) || pathname === "/dashboard";
  const isBuilderActive = pathname.startsWith("/builder");
  const isTemplatesActive = pathname === "/templates";

  const navSegments = [
    { label: "Apps", href: "/apps", active: isAppsActive },
    { label: "Builder", href: "/builder/demo", active: isBuilderActive },
    { label: "Templates", href: "/templates", active: isTemplatesActive },
  ];

  return (
    <header className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 relative z-40 shrink-0">
      {/* Floating Frosted Pill: 64px tall, glass-1 material matching landing page */}
      <div className="h-16 px-4 sm:px-5 w-full flex items-center justify-between rounded-full glass-1 transition-all">
        {/* Left: Brand + Org Breadcrumb */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            aria-label="AppForge Home"
            className="flex items-center gap-2.5 outline-none group select-none shrink-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="w-8 h-8 rounded-[10px] bg-foreground text-background flex items-center justify-center shadow-xs transition-colors">
              <AppForgeLogo size={18} isHovered={isHovered} className="text-background" />
            </div>
            <span className="font-semibold text-[15px] sm:text-[16px] tracking-tight text-slate-900 dark:text-slate-100 hidden xs:inline-block">
              AppForge
            </span>
          </Link>

          <span className="text-slate-400/40 dark:text-white/20 text-sm font-mono select-none">/</span>

          {/* Org identifier in pill format with initial (V) */}
          <div className="flex items-center">
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-[13px] font-medium text-foreground px-2.5 py-1 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 h-8 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-colors cursor-pointer select-none">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-semibold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                  {orgInitial}
                </span>
                <span className="max-w-[140px] truncate">{orgName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
              </div>
            </div>
            <div className="sm:hidden flex items-center gap-1.5 text-[13px] font-medium text-foreground px-2 py-1 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 h-8 select-none">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-semibold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                {orgInitial}
              </span>
              <span className="max-w-[80px] truncate">{orgName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
            </div>
          </div>
        </div>

        {/* Center: Segmented control (Apps / Builder / Templates) with sliding active pill */}
        <nav
          aria-label="Application Navigation"
          className="hidden md:flex items-center p-1 rounded-full bg-surface-sunken border border-border relative select-none"
        >
          {navSegments.map((seg) => (
            <Link
              key={seg.label}
              href={seg.href}
              className={`relative px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors inline-flex items-center gap-1.5 ${seg.active
                  ? "text-brand-link font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {seg.active && (
                <motion.span
                  layoutId="app-header-sliding-pill"
                  className="absolute inset-0 rounded-full bg-card shadow-xs border border-border z-0"
                  transition={MOTION_TOKENS.springStandard}
                />
              )}
              {seg.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-link shrink-0 relative z-10" />
              )}
              <span className="relative z-10">{seg.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right: Search hint (⌘K) + Theme Toggle + User profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* ⌘K Search hint */}
          <div className="relative hidden sm:flex items-center">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search apps..."
              value={activeSearchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-36 lg:w-48 h-9 pl-8 pr-11 text-[13px] bg-slate-200/40 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 focus:bg-background border border-slate-300/40 dark:border-white/10 rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
            <div className="absolute right-2 pointer-events-none">
              <Kbd>⌘K</Kbd>
            </div>
          </div>

          {/* Theme Toggle (36px neutral glass circle) */}
          <ThemeToggle />

          {/* User Profile */}
          <div className="flex items-center justify-center shrink-0">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 rounded-full border border-slate-200 dark:border-white/10",
                  userButtonPopoverCard: "glass-1 rounded-2xl shadow-xl text-foreground",
                },
              }}
            />
          </div>

          {/* Mobile menu trigger */}
          <IconButton
            variant="glass"
            size="md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </IconButton>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 p-3 rounded-2xl glass-1 border border-white/80 dark:border-white/10 flex flex-col gap-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="relative flex items-center mb-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search apps..."
              value={activeSearchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-[13px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <Link
            href="/apps"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-[14px] font-medium px-3.5 py-2 rounded-full transition-colors ${isAppsActive
                ? "bg-white text-slate-900 shadow-xs dark:bg-white/15 dark:text-white"
                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
              }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Apps</span>
          </Link>
          <Link
            href="/templates"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 text-[14px] font-medium px-3.5 py-2 rounded-full transition-colors ${isTemplatesActive
                ? "bg-white text-slate-900 shadow-xs dark:bg-white/15 dark:text-white"
                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
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
