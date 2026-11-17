"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useOrganization, useUser } from "@clerk/nextjs";

export function HomeTopBar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user } = useUser();

  const orgName = organization?.name || (user?.fullName ? `${user.fullName}'s Organization` : "Vipin's Organization");
  const orgInitial = (orgName?.[0] || "V").toUpperCase();

  const navSegments = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Builder", href: "/builder/demo" },
    { label: "Templates", href: "/templates" },
  ];

  return (
    <header className="h-16 px-8 w-full flex items-center justify-between border-b border-[#9390C8]/20 dark:border-white/10 bg-[#EEF0FA]/60 dark:bg-[#0B0C14]/60 backdrop-blur-md relative z-30 transition-colors shrink-0">
      {/* Left spacer for optical centering */}
      <div className="w-[180px] hidden md:block" />

      {/* Centered Segmented Nav */}
      <nav
        aria-label="App switcher"
        className="flex items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-1 rounded-full border border-white/70 dark:border-white/10 shadow-[0_2px_8px_-1px_rgba(30,27,75,0.04)]"
      >
        {navSegments.map((seg) => {
          const isActive = pathname === seg.href;
          return (
            <Link
              key={seg.label}
              href={seg.href}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
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

      {/* Right Controls: Single capsule housing Theme Toggle and Single Org Switcher */}
      <div className="flex items-center">
        <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors select-none">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Thin vertical hairline divider */}
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />

          {/* Single Org Switcher: Indigo circle with org initial + org name + chevron */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {orgInitial}
            </span>
            <span className="truncate max-w-[140px] font-medium text-xs text-slate-800 dark:text-slate-200">
              {orgName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </header>
  );
}
