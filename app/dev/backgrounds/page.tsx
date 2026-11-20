"use client";

import { notFound } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { CandidateBenchmarkCard } from "@/components/dev/CandidateBenchmarkCard";
import { HeroMeshBackground } from "@/components/home/HeroMeshBackground";

export default function DevBackgroundsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div className="min-h-screen bg-muted/20 text-foreground transition-colors selection:bg-brand-500/20 selection:text-foreground">
      {/* Dev Navigation & Controls Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg px-6 py-3.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              AF
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">AppForge Shipped Background</h1>
              <p className="text-xs text-muted-foreground">
                Shipped Paper Shaders MeshGradient • Full 1440×900 Hero Viewport
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden lg:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <span className="px-3 py-1 text-xs font-medium rounded-lg bg-background text-foreground flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>Paper Shaders MeshGradient (Shipped)</span>
              </span>
            </nav>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              data-is-dark={isDark ? "true" : "false"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-sm cursor-pointer"
              title="Toggle theme"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Presentation Grid */}
      <main className="max-w-[1500px] mx-auto px-6 py-10 flex flex-col items-center">
        <CandidateBenchmarkCard
          id="candidate-a"
          name="Shipped Hero Background — Paper Shaders MeshGradient"
          badge="Shipped"
          description="Paper Shaders MeshGradient with dynamic palette switching, DPR cap <= 1.5, and requestIdleCallback compilation"
          gzippedSize="42.4 KB"
          assetDetails="WebGL Shader Engine + Bundle"
          isDark={isDark}
        >
          {() => <HeroMeshBackground />}
        </CandidateBenchmarkCard>
      </main>
    </div>
  );
}
