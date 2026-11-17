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
      <div className="dark:hidden absolute -top-24 -left-20 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle_at_center,rgba(215,220,250,0.50)_0%,rgba(246,246,251,0)_70%)] blur-[60px]" />

      {/* 2. Volumetric 3D liquid glass ribbon:
             STRICTLY UNMOUNTED AND NOT RENDERED IN DARK MODE */}
      {!isDark && (
        <div className="dark:hidden absolute -top-16 -right-12 w-[820px] lg:w-[960px] xl:w-[1040px] pointer-events-none select-none">
          <Image
            src="/hero-ribbon.webp"
            alt=""
            width={1400}
            height={780}
            priority
            className="w-full h-auto object-contain select-none opacity-95"
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
