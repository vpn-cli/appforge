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
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Floating Frosted Pill: 64px tall, 16px inset from viewport */}
      <div className="h-16 px-4 sm:px-5 w-full flex items-center justify-between rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_16px_32px_-8px_rgba(99,102,241,0.06)] transition-all">
        {/* Left: Logo mark + AppForge wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 outline-none group select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors">
            <AppForgeLogo size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="font-semibold text-[15px] sm:text-[16px] tracking-tight text-slate-900 dark:text-slate-100">
            AppForge
          </span>
        </Link>

        {/* Center: Segmented control (Dashboard / Builder / Templates) - desktop */}
        <nav
          aria-label="Navigation"
          className="hidden sm:flex items-center p-1 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 backdrop-blur-md"
        >
          {navSegments.map((seg) => {
            const isActive = pathname === seg.href;
            return (
              <Link
                key={seg.label}
                href={seg.href}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_2px_6px_rgba(15,23,42,0.08)]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {seg.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme toggle, Org switcher, User avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Org Switcher pill (avatar + name + chevron) */}
          <div className="hidden md:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 select-none">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {orgInitial}
            </span>
            <span className="truncate max-w-[120px] font-medium text-[12px] text-slate-700 dark:text-slate-300">
              {orgName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={1.75} />
          </div>

          {/* User Avatar */}
          <div className="flex items-center justify-center shrink-0">
            {user ? (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-7 h-7 rounded-full border border-slate-200 dark:border-white/10",
                  },
                }}
              />
            ) : (
              <Link
                href="/login"
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:opacity-85 transition-opacity"
              >
                VK
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button (visible < 640px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_24px_rgba(15,23,42,0.1)] flex flex-col gap-1">
          {navSegments.map((seg) => (
            <Link
              key={seg.label}
              href={seg.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {seg.label}
            </Link>
          ))}
          <div className="pt-2 mt-1 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between px-3 text-xs text-slate-500">
            <span>{orgName}</span>
          </div>
        </div>
      )}
    </header>
  );
}
