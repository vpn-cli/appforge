"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Database, ShieldAlert, Zap, Server, Code, Layout } from "lucide-react";

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    // Heading reveal
    gsap.fromTo(headingRef.current, 
      { y: 50, opacity: 0 },
      {
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
        },
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out"
      }
    );

    // Fade up sections stagger on scroll
    const sections = gsap.utils.toArray<HTMLElement>('.feature-section');
    sections.forEach((sec) => {
      gsap.fromTo(sec, 
        { y: 80, opacity: 0 }, 
        {
          scrollTrigger: {
            trigger: sec,
            start: "top 75%",
          },
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "expo.out"
        }
      );
    });

    // Looping graphics - Feature 1 (Database Pipelines)
    gsap.to(".db-node", {
      y: -10,
      stagger: 0.2,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    gsap.to(".api-pulse", {
      scale: 1.2,
      opacity: 0.2,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut"
    });

    // Looping graphics - Feature 2 (Degradation Grid)
    gsap.to(".shield-ring", {
      rotation: 360,
      duration: 10,
      repeat: -1,
      ease: "linear"
    });
    gsap.to(".error-node", {
      backgroundColor: "rgba(220,112,136,0.2)",
      borderColor: "rgba(235,163,180,0.5)",
      scale: 0.95,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2,
      ease: "elastic.out(1, 0.3)"
    });

    // Looping graphics - Feature 3 (Code to Canvas morphing)
    gsap.to(".code-bracket", {
      x: 5,
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: "power2.inOut"
    });
    gsap.to(".canvas-card", {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(156,135,218,0.3)",
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="w-full mx-auto px-4 py-32 mt-8 border-t border-border overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <h2 
          ref={headingRef}
          className="text-center text-4xl md:text-5xl font-extrabold mb-32 text-foreground tracking-tight"
        >
          Instant Architecture. Zero Friction.
        </h2>

        <div className="flex flex-col gap-32">
          
          {/* Feature 1: Left Text, Right Graphic */}
          <div className="feature-section flex flex-col lg:flex-row items-center gap-16 w-full">
            <div className="flex-1 space-y-6">
              <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center shadow-lg shadow-brand/5">
                <Database size={28} className="text-brand" />
              </div>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Dynamic Backends</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                Instantly generated Postgres schemas and REST APIs based purely on your JSON entity definitions. 
                AppForge inspects your frontend components and dynamically binds data endpoints before you even write a single line of backend logic.
              </p>
            </div>
            
            <div className="flex-1 w-full h-[400px] relative flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent rounded-[3rem] border border-border/50 dark:border-white/5 -z-10" />
               <div className="relative w-full max-w-md h-full flex items-center justify-center gap-8">
                 <div className="flex flex-col gap-4 relative z-10">
                   {[1, 2, 3].map((i) => (
                     <div key={i} className={`db-node bg-card border border-border shadow-md rounded-lg p-4 flex items-center gap-3`}>
                       <Server size={18} className="text-muted-foreground" />
                       <div className="w-16 h-2 bg-muted rounded-full" />
                     </div>
                   ))}
                 </div>
                 {/* Connecting flow line */}
                 <div className="w-16 border-t-2 border-dashed border-brand/40 relative">
                   <div className="absolute w-4 h-4 bg-brand rounded-full -top-[9px] left-1/2 -translate-x-1/2 api-pulse" />
                 </div>
                 <div className="db-node bg-brand/10 border border-brand/30 shadow-[0_0_30px_rgba(156,135,218,0.2)] rounded-2xl p-8 flex flex-col items-center justify-center text-brand">
                    <Database size={40} className="mb-2" />
                    <span className="font-mono text-xs font-bold tracking-widest">LIVE DB</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Feature 2: Left Graphic, Right Text */}
          <div className="feature-section flex flex-col-reverse lg:flex-row items-center gap-16 w-full">
            <div className="flex-1 w-full h-[400px] relative flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-success/5 to-transparent rounded-[3rem] border border-border/50 dark:border-white/5 -z-10" />
               <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                 {/* Rotating Shield HUD */}
                 <div className="absolute w-64 h-64 border border-dashed border-success/30 rounded-full shield-ring" />
                 <div className="absolute w-48 h-48 border border-success/10 rounded-full shield-ring" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
                 
                 <div className="grid grid-cols-2 gap-4 relative z-10 p-6 bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                   <div className="w-20 h-20 bg-card border border-border rounded-xl flex items-center justify-center">
                     <Layout size={24} className="text-muted-foreground opacity-50" />
                   </div>
                   <div className="error-node w-20 h-20 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg">
                     <ShieldAlert size={24} className="text-error" />
                   </div>
                   <div className="w-20 h-20 bg-card border border-border rounded-xl flex items-center justify-center">
                     <Layout size={24} className="text-muted-foreground opacity-50" />
                   </div>
                   <div className="w-20 h-20 bg-card border border-border rounded-xl flex items-center justify-center">
                     <Layout size={24} className="text-muted-foreground opacity-50" />
                   </div>
                 </div>
               </div>
            </div>

            <div className="flex-1 space-y-6 lg:pl-12">
              <div className="w-14 h-14 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center shadow-lg shadow-success/5">
                <ShieldAlert size={28} className="text-success" />
              </div>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Graceful Degradation</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                Broken config? Missing fields? AppForge treats your UI like a microservices architecture. 
                Instead of crashing the page, it isolates the specific rendering error with a localized Error Boundary so your layout remains interactive and functional.
              </p>
            </div>
          </div>

          {/* Feature 3: Left Text, Right Graphic */}
          <div className="feature-section flex flex-col lg:flex-row items-center gap-16 w-full">
            <div className="flex-1 space-y-6">
              <div className="w-14 h-14 bg-warning/10 border border-warning/20 rounded-2xl flex items-center justify-center shadow-lg shadow-warning/5">
                <Zap size={28} className="text-warning-text" />
              </div>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Instant Preview</h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                Experience unparalleled developer velocity. The side-by-side builder interface monitors your JSON runtime in 
                real-time, immediately validating schema structures and syncing layout mutations to the DOM in under 5ms.
              </p>
            </div>
            
            <div className="flex-1 w-full h-[400px] relative flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent rounded-[3rem] border border-border/50 dark:border-white/5 -z-10" />
               <div className="relative w-full max-w-lg flex items-center justify-between px-8">
                 {/* Left side: Code Block */}
                 <div className="bg-card w-48 p-5 rounded-xl border border-border shadow-md code-bracket relative z-10 flex flex-col gap-3">
                   <div className="flex items-center gap-2 mb-2">
                     <Code size={16} className="text-warning-text" />
                     <span className="text-[10px] font-mono font-bold text-muted-foreground">JSON</span>
                   </div>
                   <div className="h-2 w-full bg-muted rounded" />
                   <div className="h-2 w-3/4 bg-muted rounded" />
                   <div className="h-2 w-5/6 bg-muted rounded" />
                   <div className="h-2 w-1/2 bg-muted rounded" />
                 </div>

                 {/* Arrow */}
                 <div className="flex-1 flex justify-center text-muted-foreground/30 px-4">
                   <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                     <path d="M0 12h38M28 2l10 10-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                 </div>

                 {/* Right side: Rendered Card */}
                 <div className="bg-gradient-to-br from-card to-background w-56 p-6 rounded-2xl border border-border shadow-xl canvas-card relative z-10 flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-warning/20 border border-warning/30" />
                     <div className="flex flex-col gap-2 flex-1">
                       <div className="h-2 w-full bg-foreground/20 rounded" />
                       <div className="h-2 w-2/3 bg-foreground/10 rounded" />
                     </div>
                   </div>
                   <div className="h-24 w-full bg-muted/50 rounded-xl" />
                   <div className="h-8 w-full bg-brand text-[10px] font-bold text-white flex items-center justify-center rounded-lg shadow-sm">
                     Rendered Component
                   </div>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
