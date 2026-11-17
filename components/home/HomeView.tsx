"use client";

import { HomeSidebar } from "./HomeSidebar";
import { HomeTopBar } from "./HomeTopBar";
import { HomeHero } from "./HomeHero";
import { DemoRow } from "./DemoRow";
import { BackgroundRibbons } from "./BackgroundRibbons";

export function HomeView() {
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-[#E6E8FA] via-[#EEF0FD] to-[#E5E9FB] dark:from-[#090A10] dark:via-[#0D0F1B] dark:to-[#0A0C16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left App Shell Sidebar */}
      <HomeSidebar />

      {/* Right Main Column */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <BackgroundRibbons />
        <HomeTopBar />
        <main className="flex-1 flex flex-col items-center relative z-10 w-full">
          <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col items-center">
            <HomeHero />
            <DemoRow />
          </div>
        </main>
      </div>
    </div>
  );
}
