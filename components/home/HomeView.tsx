"use client";

import { HomeTopBar } from "./HomeTopBar";
import { HomeHero } from "./HomeHero";
import { DemoRow } from "./DemoRow";
import { BackgroundRibbons } from "./BackgroundRibbons";
import { Features } from "@/components/homepage/Features";
import { Footer } from "@/components/layout/Footer";

export function HomeView() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground transition-colors relative overflow-x-hidden selection:bg-brand-500/20 selection:text-foreground">
      {/* Background glass ribbon & atmospheric wash */}
      <BackgroundRibbons />

      {/* Floating frosted top bar */}
      <HomeTopBar />

      {/* Main full-width centered content */}
      <main className="flex-1 flex flex-col items-center relative z-10 w-full">
        {/* Hero on canvas */}
        <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center">
          <HomeHero />
          <DemoRow />
        </div>

        {/* Features on surface-sunken with soft gradient transitions */}
        <div className="w-full landing-features-band mt-16 sm:mt-24">
          <Features />
        </div>
      </main>

      {/* Footer on canvas */}
      <Footer />
    </div>
  );
}
