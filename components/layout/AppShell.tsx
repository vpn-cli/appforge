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
    <div className="min-h-screen flex flex-col bg-[#F6F6FB] dark:bg-[#0B0B10] text-foreground antialiased selection:bg-brand/20 selection:text-brand relative overflow-x-hidden">
      {/* Background treatment: same language as landing page, but quieter for dashboard productivity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
      >
        {/* Light mode: faint lavender wash in top-left */}
        <div className="dark:hidden absolute -top-32 -left-20 w-[580px] h-[580px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,220,250,0.35)_0%,rgba(246,246,251,0)_70%)] blur-[70px]" />

        {/* Light mode: quieter translucent ribbon in top-right */}
        <div className="dark:hidden absolute -top-20 -right-16 w-[700px] lg:w-[840px] pointer-events-none select-none opacity-25">
          <Image
            src="/hero-ribbon.webp"
            alt=""
            width={1200}
            height={680}
            priority
            className="w-full h-auto object-contain select-none"
          />
        </div>

        {/* Dark mode: quiet single indigo glow at top center */}
        <div className="hidden dark:block absolute -top-[120px] left-1/2 -translate-x-1/2 w-[55vw] h-[35vh] max-w-[900px] rounded-full bg-[radial-gradient(ellipse_60%_35%_at_50%_25%,rgba(99,102,241,0.08)_0%,rgba(99,102,241,0)_70%)] blur-[100px] pointer-events-none" />
      </div>

      <AppHeader activeSearchQuery={activeSearchQuery} onSearchChange={onSearchChange} />
      <main id="main-content" className="flex-1 w-full flex flex-col relative z-10">
        {children}
      </main>
    </div>
  );
}
