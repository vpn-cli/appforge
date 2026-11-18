"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, LayoutTemplate, ChevronDown } from "lucide-react";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { useUser, UserButton } from "@clerk/nextjs";

export function HomeSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Apps", href: "/dashboard", icon: LayoutGrid },
    { label: "Templates", href: "/templates", icon: LayoutTemplate },
  ];

  return (
    <aside className="w-[240px] shrink-0 min-h-screen sticky top-0 flex flex-col justify-between bg-card/85 dark:bg-card/90 backdrop-blur-md border-r border-border p-5 z-40 transition-colors select-none">
      {/* Top: Logo & Brand */}
      <div className="flex flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg outline-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 dark:bg-brand-400/20 flex items-center justify-center text-brand-link">
            <AppForgeLogo size={22} className="text-brand-link" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">
            AppForge
          </span>
        </Link>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`h-[44px] px-3.5 rounded-xl flex items-center gap-3 text-[15px] font-medium transition-all ${
                  isActive
                    ? "bg-brand-100 dark:bg-brand-950/60 text-brand-link shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Row */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors group">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-indigo-200 dark:border-indigo-800",
                },
              }}
            />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {user?.fullName || user?.firstName || "Vipin Kaushik"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" strokeWidth={1.75} />
        </div>
      </div>
    </aside>
  );
}
