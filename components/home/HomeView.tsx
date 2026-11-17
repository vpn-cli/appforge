"use client";

import { HomeTopBar } from "./HomeTopBar";
import { HomeHero } from "./HomeHero";
import { DemoRow } from "./DemoRow";
import { BackgroundRibbons } from "./BackgroundRibbons";
import { Features } from "@/components/homepage/Features";
import { Footer } from "@/components/layout/Footer";

export function HomeView() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F6F6FB] dark:bg-[#0B0B10] text-slate-900 dark:text-slate-100 transition-colors relative overflow-x-hidden selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200">
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
        <Features />
      </main>

      {/* Restored Footer */}
      <Footer />
    </div>
  );
}
