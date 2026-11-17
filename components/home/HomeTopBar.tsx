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
    <header className="h-[72px] px-6 w-full flex items-center justify-between border-b border-[#9390C8]/20 dark:border-white/10 bg-[#EEF0FA]/70 dark:bg-[#0B0C14]/70 backdrop-blur-md relative z-30 transition-colors">
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
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
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

      {/* Right Controls: Theme Toggle | Single Org Switcher */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Thin vertical divider */}
        <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />

        {/* Only ONE Org Switcher: Indigo circle with org initial + org name + chevron */}
        <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors select-none">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {orgInitial}
          </span>
          <span className="truncate max-w-[140px] font-medium">{orgName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
        </div>
      </div>
    </header>
  );
}
