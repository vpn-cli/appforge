"use client";

import { AppHeader } from "@/components/layout/AppHeader";

type Props = {
  children: React.ReactNode;
  activeSearchQuery?: string;
  onSearchChange?: (q: string) => void;
};

export function AppShell({ children, activeSearchQuery, onSearchChange }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-brand/20 selection:text-brand relative overflow-x-hidden">
      {/* Background treatment: same language as landing page, but quieter */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
      >
        {/* Light mode: faint lavender wash */}
        <div className="dark:hidden absolute -top-32 -left-20 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,220,250,0.35)_0%,rgba(246,246,251,0)_70%)] blur-[70px]" />

        {/* Dark mode: quiet single indigo glow */}
        <div className="hidden dark:block absolute -top-[100px] left-1/2 -translate-x-1/2 w-[55vw] h-[35vh] max-w-[900px] rounded-full bg-[radial-gradient(ellipse_60%_35%_at_50%_25%,rgba(99,102,241,0.10)_0%,rgba(99,102,241,0)_70%)] blur-[90px] pointer-events-none" />
      </div>

      <AppHeader activeSearchQuery={activeSearchQuery} onSearchChange={onSearchChange} />
      <main id="main-content" className="flex-1 w-full flex flex-col relative z-10">
        {children}
      </main>
    </div>
  );
}
