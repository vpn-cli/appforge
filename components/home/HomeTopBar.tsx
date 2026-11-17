"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useOrganization, useUser, UserButton } from "@clerk/nextjs";

export function HomeTopBar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user, isLoaded, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isUserSignedIn = isLoaded && isSignedIn;

  const orgName =
    organization?.name ||
    (user?.fullName ? `${user.fullName}'s Organization` : "Vipin's Organization");
  const orgInitial = (orgName?.[0] || "V").toUpperCase();

  const navSegments = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Builder", href: "/builder/demo" },
    { label: "Templates", href: "/templates" },
  ];

  return (
    <header className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 relative z-30 shrink-0">
      {/* Hidden SVG displacement map filter for Chromium progressive enhancement refraction */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="glass-edge-refract" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Floating Frosted Pill: 64px tall, 16px inset from viewport, glass-1 material */}
      <div className="h-16 px-4 sm:px-5 w-full flex items-center justify-between rounded-full glass-1 transition-all">
        {/* Left: Logo mark sits on a dark squircle tile (light mode) for an anchor */}
        <Link
          href="/"
          className="flex items-center gap-2.5 outline-none group select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-[10px] bg-slate-900 text-white dark:bg-white/10 dark:text-white flex items-center justify-center shadow-xs transition-colors">
            <AppForgeLogo size={18} className="text-white" />
          </div>
          <span className="font-semibold text-[15px] sm:text-[16px] tracking-tight text-slate-900 dark:text-slate-100">
            AppForge
          </span>
        </Link>

        {/* Center: Segmented control (Dashboard / Builder / Templates) - desktop */}
        {/* All nav text is 15px, weight 500 */}
        <nav
          aria-label="Navigation"
          className="hidden sm:flex items-center p-1 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10"
        >
          {navSegments.map((seg) => {
            const isActive = pathname === seg.href || (pathname === "/" && seg.label === "Dashboard");
            return (
              <Link
                key={seg.label}
                href={seg.href}
                className={`px-4 py-1.5 rounded-full text-[15px] font-medium transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.08)] dark:bg-white/[0.12] dark:text-white dark:shadow-none"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {seg.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme toggle (36px), Org switcher (15px, weight 500), User avatar (36px) - all vertically centered */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme toggle (36px) */}
          <ThemeToggle />

          {/* Org Switcher pill (avatar + name + chevron) - 15px weight 500 */}
          <div className="hidden md:flex items-center gap-2.5 pl-1.5 pr-3 h-9 rounded-full glass-2-nested text-slate-800 dark:text-slate-200 select-none">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-semibold text-[11px] flex items-center justify-center shrink-0">
              {orgInitial}
            </span>
            <span className="truncate max-w-[160px] font-medium text-[15px] text-slate-800 dark:text-slate-200">
              {orgName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
          </div>

          {/* User Avatar (36px) */}
          <div className="flex items-center justify-center shrink-0">
            {isUserSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 rounded-full border border-slate-200 dark:border-white/10",
                  },
                }}
              />
            ) : (
              <Link
                href="/login"
                className="w-9 h-9 rounded-full bg-slate-200/80 dark:bg-white/10 flex items-center justify-center text-[12px] font-semibold text-slate-800 dark:text-slate-100 hover:opacity-90 transition-opacity border border-slate-300/60 dark:border-white/10"
                aria-label="User profile"
              >
                VK
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 p-3 rounded-2xl glass-1 border border-white/80 dark:border-white/10 flex flex-col gap-1 shadow-lg">
          {navSegments.map((seg) => {
            const isActive = pathname === seg.href || (pathname === "/" && seg.label === "Dashboard");
            return (
              <Link
                key={seg.label}
                href={seg.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-xl text-[15px] font-medium transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs dark:bg-white/10 dark:text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5"
                }`}
              >
                {seg.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
