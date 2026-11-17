"use client";

import Image from "next/image";

export function BackgroundRibbons() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {/* ========================================================
          LIGHT MODE BACKGROUND
          ======================================================== */}
      {/* 1. Faint lavender radial wash in top-left to balance the right ribbon */}
      <div className="dark:hidden absolute -top-24 -left-20 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,220,250,0.50)_0%,rgba(246,246,251,0)_70%)] blur-[60px]" />

      {/* 2. Rendered volumetric 3D periwinkle liquid glass ribbon asset (WebP, under 250KB, 2x) */}
      {/* Placement: top-right, sweeping behind the hero area */}
      <div className="dark:hidden absolute -top-8 right-0 w-[720px] lg:w-[860px] xl:w-[940px] pointer-events-none select-none">
        <Image
          src="/hero-ribbon.webp"
          alt=""
          width={1400}
          height={780}
          priority
          className="w-full h-auto object-contain select-none"
        />
      </div>

      {/* ========================================================
          DARK MODE BACKGROUND (NO RIBBON)
          ======================================================== */}
      {/* 1. Single wide elliptical radial glow centered ABOVE the headline (indigo, ~20% alpha, fading by mid-page) */}
      <div className="hidden dark:block absolute -top-[140px] left-1/2 -translate-x-1/2 w-[1100px] h-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.20)_0%,rgba(79,70,229,0.06)_50%,transparent_75%)] blur-[90px]" />

      {/* 2. Second very soft violet glow (~10%) centered behind the panels so the glass has something to pick up */}
      <div className="hidden dark:block absolute top-[450px] left-1/2 -translate-x-1/2 w-[980px] h-[460px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.10)_0%,rgba(124,58,237,0.03)_50%,transparent_70%)] blur-[90px]" />

      {/* 3. Optional dot grid at 4% opacity, masked to fade out radially from the center */}
      <div
        className="hidden dark:block absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"
        style={{
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 45%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 45%, black 20%, transparent 100%)",
        }}
      />
    </div>
  );
}
