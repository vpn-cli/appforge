"use client";

import Link from "next/link";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function PublicHeader() {
  return (
    <header className="h-[72px] max-w-[1240px] mx-auto px-6 w-full flex items-center justify-between border-b border-[#9390C8]/20 dark:border-white/10 relative z-30 transition-colors">
      <Link href="/" className="flex items-center gap-2.5 outline-none group">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <AppForgeLogo size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100">
          AppForge
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
          <Button
            variant="ghost"
            className="text-sm font-medium hover:bg-slate-200/50 dark:hover:bg-slate-800/50 h-9 px-4 text-slate-700 dark:text-slate-200"
          >
            Log in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
          <Button className="bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] hover:bg-[#1E1E24] dark:hover:bg-slate-100 font-medium text-sm h-9 px-4 rounded-lg shadow-sm transition-colors">
            Start for free
          </Button>
        </SignUpButton>
      </div>
    </header>
  );
}
