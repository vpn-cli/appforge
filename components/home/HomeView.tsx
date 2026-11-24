import { HeroMeshBackground } from "./HeroMeshBackground";
import { HomeTopBar } from "./HomeTopBar";
import { HomeHero } from "./HomeHero";
import { DemoRow } from "./DemoRow";
import { StorySection } from "./StorySection";
import { TemplatesStrip } from "./TemplatesStrip";
import { Footer } from "@/components/layout/Footer";

export function HomeView() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground transition-colors relative overflow-x-hidden selection:bg-brand-500/20 selection:text-foreground">
      {/* Top-level banner landmark overlaid cleanly over the hero mesh */}
      <div className="absolute top-0 inset-x-0 z-30">
        <HomeTopBar />
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col w-full outline-none"
      >
        {/* Hero section (min-h-[100dvh], vertically centred) with scoped animated mesh-gradient background */}
        <section
          data-testid="hero-section"
          className="relative w-full min-h-[100dvh] pt-20 flex flex-col overflow-hidden"
        >
          <HeroMeshBackground />

          <div className="flex-1 flex flex-col justify-center py-4 pb-8 relative z-10 w-full">
            <HomeHero />
            <DemoRow />
          </div>
        </section>

        {/* Below-the-fold sections */}
        <StorySection />
        <TemplatesStrip />
      </main>

      <Footer />
    </div>
  );
}
