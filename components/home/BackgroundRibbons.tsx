"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export function BackgroundRibbons() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {/* ========================================================
          LIGHT MODE BACKGROUND
          ======================================================== */}
      {/* 1. Faint lavender radial wash in top-left to balance the right ribbon */}
      <div className="dark:hidden absolute -top-24 -left-20 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,220,250,0.65)_0%,rgba(238,240,250,0)_70%)] blur-[60px]" />

      {/* 2. Volumetric 3D liquid glass ribbon at full presence sweeping behind right side of hero */}
      {!isDark && (
        <div className="dark:hidden absolute -top-12 -right-8 w-[880px] lg:w-[1020px] xl:w-[1140px] pointer-events-none select-none">
          <Image
            src="/hero-ribbon.webp"
            alt=""
            width={1400}
            height={780}
            priority
            className="w-full h-auto object-contain select-none opacity-100 drop-shadow-[0_20px_40px_rgba(110,120,220,0.22)]"
          />
        </div>
      )}

      {/* ========================================================
          DARK MODE BACKGROUND (SMOKED GLASS, NO RIBBON)
          ONE radial indigo glow at top center (rgba(99,102,241,.16),
          ellipse about 60%×40%), 3% noise (via locked body overlay).
          Nothing else.
          ======================================================== */}
      <div className="hidden dark:block absolute -top-[120px] left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] max-w-[1100px] rounded-full bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(99,102,241,0.16)_0%,rgba(99,102,241,0)_70%)] blur-[90px] pointer-events-none" />
    </div>
  );
}
