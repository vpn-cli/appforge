"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export function BackgroundRibbons() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Restrained scroll parallax: translates slightly (0 -> 48px) as page scrolls down
  const ribbonY = useTransform(scrollY, [0, 800], [0, 48]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  // Mask that smoothly fades out on ALL 4 edges and leaves a completely calm zone behind the hero text
  const ribbonMaskStyle: React.CSSProperties = {
    maskImage:
      "radial-gradient(ellipse 34% 50% at 68% 48%, black 35%, rgba(0,0,0,0.65) 68%, transparent 100%)",
    WebkitMaskImage:
      "radial-gradient(ellipse 34% 50% at 68% 48%, black 35%, rgba(0,0,0,0.65) 68%, transparent 100%)",
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {/* ========================================================
          LIGHT MODE BACKGROUND
          ======================================================== */}
      {/* 1. brand-100 top-left radial wash (about 60% size) */}
      <div className="dark:hidden absolute -top-24 -left-20 w-[640px] sm:w-[800px] h-[640px] sm:h-[800px] rounded-full bg-[radial-gradient(circle_at_center,var(--brand-100)_0%,rgba(242,241,249,0)_70%)] blur-[70px] opacity-80" />

      {/* 2. Soft wash bottom-right radial wash */}
      <div className="dark:hidden absolute top-[400px] -right-24 w-[700px] sm:w-[900px] h-[700px] sm:h-[900px] rounded-full bg-[radial-gradient(circle_at_center,var(--wash-blue)_0%,rgba(242,241,249,0)_70%)] blur-[80px] opacity-80" />

      {/* 3. Dot grid at 4% ink-900, masked to fade radially from the center */}
      <div
        className="dark:hidden absolute inset-0 bg-[radial-gradient(rgba(23,23,31,0.04)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"
        style={{
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 100%)",
        }}
      />

      {/* 4. Volumetric 3D liquid glass ribbon (Light Mode) */}
      <motion.div
        style={{
          y: shouldReduceMotion ? 0 : ribbonY,
          ...ribbonMaskStyle,
        }}
        className="dark:hidden absolute -top-12 -right-8 w-[880px] lg:w-[1020px] xl:w-[1140px] pointer-events-none select-none transition-opacity duration-300"
      >
        <Image
          src="/hero-ribbon.webp"
          alt=""
          width={1400}
          height={780}
          priority
          className="w-full h-auto object-contain select-none opacity-100 drop-shadow-[0_20px_40px_rgba(109,91,240,0.22)]"
        />
      </motion.div>

      {/* ========================================================
          DARK MODE BACKGROUND
          1. Indigo top glow
          2. The dark ribbon
          3. Dot grid at 4% white
          ======================================================== */}
      {/* Top-center indigo radial glow behind headline */}
      <div className="hidden dark:block absolute top-6 left-1/2 -translate-x-1/2 w-[900px] h-[480px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(109,91,240,0.18)_0%,rgba(91,69,224,0.05)_45%,transparent_75%)] blur-[70px] pointer-events-none" />

      {/* Dot grid at 4% white, masked to fade radially from the center */}
      <div
        className="hidden dark:block absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"
        style={{
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 100%)",
        }}
      />

      {/* Dedicated Dark Glass Ribbon */}
      <motion.div
        style={{
          y: shouldReduceMotion ? 0 : ribbonY,
          ...ribbonMaskStyle,
          mixBlendMode: "screen",
        }}
        className="hidden dark:block absolute -top-12 -right-8 w-[880px] lg:w-[1020px] xl:w-[1140px] pointer-events-none select-none transition-opacity duration-300"
      >
        <Image
          src="/hero-ribbon-dark.webp"
          alt=""
          width={1400}
          height={780}
          priority
          className="w-full h-auto object-contain select-none"
        />
      </motion.div>
    </div>
  );
}
