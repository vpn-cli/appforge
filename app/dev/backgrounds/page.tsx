"use client";

import { notFound } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Sparkles, Activity, Layers, Video } from "lucide-react";
import { CandidateBenchmarkCard } from "@/components/dev/CandidateBenchmarkCard";
import { CandidateAMeshGradient } from "@/components/candidates/CandidateAMeshGradient";
import { CandidateBAurora } from "@/components/candidates/CandidateBAurora";
import { CandidateCIridescence } from "@/components/candidates/CandidateCIridescence";
import { CandidateDVideo } from "@/components/candidates/CandidateDVideo";

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
              <h1 className="text-base font-bold tracking-tight">AppForge Background Candidates</h1>
              <p className="text-xs text-muted-foreground">
                Part 1 Exploration • Full 1440×900 Hero Viewport • Measured 10s Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Jump links */}
            <nav className="hidden lg:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <a href="#candidate-a" className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-background transition-colors flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>A: MeshGradient</span>
              </a>
              <a href="#candidate-b" className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-background transition-colors flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                <span>B: 21st Aurora</span>
              </a>
              <a href="#candidate-c" className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-background transition-colors flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-500" />
                <span>C: ReactBits (OGL)</span>
              </a>
              <a href="#candidate-d" className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-background transition-colors flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-500" />
                <span>D: Ribbon Video</span>
              </a>
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-sm"
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

      {/* Main Candidates Presentation Grid */}
      <main className="max-w-[1500px] mx-auto px-6 py-10 flex flex-col items-center">
        {/* Candidate A */}
        <CandidateBenchmarkCard
          id="candidate-a"
          name="Candidate A — Retuned Paper MeshGradient"
          badge="Candidate A"
          description="Retuned @paper-design/shaders-react MeshGradient (distortion 0.65, swirl 0.4, ~12s cycle)"
          gzippedSize="42.4 KB"
          assetDetails="WebGL Shader Engine + Bundle"
          isDark={isDark}
        >
          {({ isDark, isPaused }) => (
            <CandidateAMeshGradient isDark={isDark} isPaused={isPaused} />
          )}
        </CandidateBenchmarkCard>

        {/* Candidate B */}
        <CandidateBenchmarkCard
          id="candidate-b"
          name="Candidate B — 21st.dev Canvas Aurora"
          badge="Candidate B"
          description="21st.dev Aurora Background (adapted to AppForge violet/ink tokens with 4 drifting color blobs)"
          gzippedSize="2.8 KB"
          assetDetails="Ultra-light Canvas 2D Engine"
          isDark={isDark}
        >
          {({ isDark, isPaused }) => (
            <CandidateBAurora isDark={isDark} isPaused={isPaused} />
          )}
        </CandidateBenchmarkCard>

        {/* Candidate C */}
        <CandidateBenchmarkCard
          id="candidate-c"
          name="Candidate C — ReactBits Iridescence (OGL)"
          badge="Candidate C"
          description="Fluid organic wave shader powered by lightweight OGL (simplex noise, aspect-ratio preserved)"
          gzippedSize="14.2 KB"
          assetDetails="OGL Micro-Engine (15KB) + GLSL"
          isDark={isDark}
        >
          {({ isDark, isPaused }) => (
            <CandidateCIridescence isDark={isDark} isPaused={isPaused} />
          )}
        </CandidateBenchmarkCard>

        {/* Candidate D */}
        <CandidateBenchmarkCard
          id="candidate-d"
          name="Candidate D — Looping 3D Glass Ribbon Video"
          badge="Candidate D"
          description="High-definition 10s looping WebM + MP4 video with poster fallback (under 2MB, 0ms JS runtime)"
          gzippedSize="485 KB / 1.23 MB"
          assetDetails="MP4 (485KB), WebM (1.2MB), 0KB JS"
          isDark={isDark}
        >
          {({ isDark, isPaused }) => (
            <CandidateDVideo isDark={isDark} isPaused={isPaused} />
          )}
        </CandidateBenchmarkCard>
      </main>
    </div>
  );
}
