"use client";

import { useRef } from "react";
import { Zap, Database, ShieldAlert } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

    // Cards staggered pop-in and float
    const cards = gsap.utils.toArray<HTMLElement>('.feature-card');
    
    gsap.fromTo(cards, 
      { y: 100, opacity: 0 },
      {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "back.out(1.7)"
      }
    );

    // Optional: Add subtle scroll scrub parallax to icons
    cards.forEach(card => {
      const icon = card.querySelector('.feature-icon');
      gsap.fromTo(icon, 
        { y: 0, rotation: 0 },
        {
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1
          },
          y: -15,
          rotation: 5
        }
      );
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="max-w-7xl mx-auto px-4 py-20 mt-8 border-t border-border overflow-hidden">
      <h2 
        ref={headingRef}
        className="text-center text-3xl font-bold mb-14 text-text-primary tracking-tight"
      >
        Configuration over Boilerplate
      </h2>

      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div 
          className="feature-card bg-surface p-8 rounded-xl border border-border shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-brand/40"
        >
          <div className="feature-icon w-14 h-14 bg-brand-light rounded-full flex items-center justify-center mb-2 shadow-sm">
            <Database size={26} className="text-brand" />
          </div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">
            Dynamic Backends
          </h3>
          <p className="text-text-secondary text-base leading-relaxed">
            Instantly generated Postgres schemas and REST APIs based purely on
            your JSON entity definitions.
          </p>
        </div>

        <div 
          className="feature-card bg-surface p-8 rounded-xl border border-border shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-success/40"
        >
          <div className="feature-icon w-14 h-14 bg-success-light rounded-full flex items-center justify-center mb-2 shadow-sm">
            <ShieldAlert size={26} className="text-success" />
          </div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">
            Graceful Degradation
          </h3>
          <p className="text-text-secondary text-base leading-relaxed">
            Broken config? Missing fields? AppForge isolates errors to a single
            component so your layout never crashes.
          </p>
        </div>

        <div 
          className="feature-card bg-surface p-8 rounded-xl border border-border shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-warning-border"
        >
          <div className="feature-icon w-14 h-14 bg-warning-light rounded-full flex items-center justify-center mb-2 shadow-sm">
            <Zap size={26} className="text-warning-text" />
          </div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">
            Instant Preview
          </h3>
          <p className="text-text-secondary text-base leading-relaxed">
            A side-by-side builder interface that renders your JSON runtime in
            real-time as you type, instantly catching errors.
          </p>
        </div>
      </div>
    </section>
  );
}
