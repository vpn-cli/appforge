"use client";

import { HomeTopBar } from "./HomeTopBar";
import { HomeHero } from "./HomeHero";
import { DemoRow } from "./DemoRow";
import { BackgroundRibbons } from "./BackgroundRibbons";

export function HomeView() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-[#EEF0FA] via-[#F5F6FD] to-[#EAEBF8] dark:from-[#0B0D17] dark:via-[#0E1122] dark:to-[#0A0C16] text-slate-900 dark:text-slate-100 transition-colors relative overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200">
      {/* Background glass ribbon & atmospheric wash */}
      <BackgroundRibbons />

      {/* Floating frosted top bar */}
      <HomeTopBar />

      {/* Main full-width centered content */}
      <main className="flex-1 flex flex-col items-center relative z-10 w-full">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center">
          <HomeHero />
          <DemoRow />
        </div>
      </main>
    </div>
  );
}
