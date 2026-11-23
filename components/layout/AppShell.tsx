"use client";

import Image from "next/image";
import { AppHeader } from "@/components/layout/AppHeader";

type Props = {
  children: React.ReactNode;
  activeSearchQuery?: string;
  onSearchChange?: (q: string) => void;
};

export function AppShell({ children, activeSearchQuery, onSearchChange }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-brand-500/20 selection:text-foreground relative overflow-x-hidden">
      {/* Background treatment: same canvas and washes at half strength */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
      >
        {/* Light mode: brand-100 top-left wash at half strength */}
        <div className="dark:hidden absolute -top-32 -left-20 w-[580px] h-[580px] rounded-full bg-[radial-gradient(circle_at_center,var(--brand-100)_0%,rgba(242,241,249,0)_70%)] blur-[70px] opacity-40" />

        {/* Light mode: bottom-right wash at half strength */}
        <div className="dark:hidden absolute top-[300px] -right-20 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,var(--wash-blue)_0%,rgba(242,241,249,0)_70%)] blur-[80px] opacity-40" />

        {/* Light mode: dot grid at half strength (2% ink-900), masked radially */}
        <div
          className="dark:hidden absolute inset-0 bg-[radial-gradient(rgba(23,23,31,0.02)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"
          style={{
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)",
          }}
        />

        {/* Dark mode: indigo glow at half strength */}
        <div className="hidden dark:block absolute -top-[120px] left-1/2 -translate-x-1/2 w-[55vw] h-[35vh] max-w-[900px] rounded-full bg-[radial-gradient(ellipse_60%_35%_at_50%_25%,rgba(109,91,240,0.09)_0%,rgba(91,69,224,0.02)_50%,transparent_70%)] blur-[100px] pointer-events-none" />

        {/* Dark mode: dot grid at half strength (2% white), masked radially */}
        <div
          className="hidden dark:block absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"
          style={{
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)",
          }}
        />
      </div>

      <AppHeader activeSearchQuery={activeSearchQuery} onSearchChange={onSearchChange} />
      <main id="main-content" className="flex-1 w-full flex flex-col relative z-10">
        {children}
      </main>
    </div>
  );
}
