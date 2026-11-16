"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { HomeSidebar } from "./HomeSidebar";
import { HomeTopBar } from "./HomeTopBar";
import { PublicHeader } from "./PublicHeader";
import { HomeHero } from "./HomeHero";
import { DemoRow } from "./DemoRow";
import { BackgroundRibbons } from "./BackgroundRibbons";

function HomeContent() {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();

  // If user is signed in, or if explicit shell preview is requested (?preview=shell or ?shell=true):
  const isShellPreview = searchParams.get("preview") === "shell" || searchParams.get("shell") === "true";
  const showAppShell = isShellPreview || (isLoaded && isSignedIn);

  if (showAppShell) {
    return (
      <div className="min-h-screen w-full flex bg-gradient-to-br from-[#E6E8FA] via-[#EEF0FD] to-[#E5E9FB] dark:from-[#090A10] dark:via-[#0D0F1B] dark:to-[#0A0C16] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Left App Shell Sidebar (~220px) */}
        <HomeSidebar />

        {/* Right Main Column */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <BackgroundRibbons />
          <HomeTopBar />
          <main className="flex-1 flex flex-col justify-start relative z-10 overflow-y-auto">
            <HomeHero />
            <DemoRow />
          </main>
        </div>
      </div>
    );
  }

  // Signed-out visitors: simple public header, hero and demo row without sidebar and top bar
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#E6E8FA] via-[#EEF0FD] to-[#E5E9FB] dark:from-[#090A10] dark:via-[#0D0F1B] dark:to-[#0A0C16] text-slate-900 dark:text-slate-100 relative transition-colors">
      <BackgroundRibbons />
      <PublicHeader />
      <main className="flex-1 flex flex-col justify-start relative z-10">
        <HomeHero />
        <DemoRow />
      </main>
    </div>
  );
}

export function HomeView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF0FD] dark:bg-[#0B0C14]" />}>
      <HomeContent />
    </Suspense>
  );
}
