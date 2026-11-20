"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  isDark?: boolean;
  isPaused?: boolean;
};

export function CandidateDVideo({ isDark = false, isPaused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Constraints:
  // 1. Poster image only on mobile (< 768px or pointer: coarse)
  // 2. Poster image only with prefers-reduced-motion
  // 3. Poster image only with Save-Data
  // 4. Load video ONLY after first paint (preload="none", start after window load)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [usePosterOnly, setUsePosterOnly] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check prefers-reduced-motion
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check mobile (< 768px or pointer: coarse)
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const isNarrow = window.innerWidth < 768 || window.matchMedia("(max-width: 767px)").matches;
    const isMobile = isCoarse || isNarrow;

    // Check Save-Data
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const hasSaveData = nav.connection?.saveData === true;

    if (reducedMotion || isMobile || hasSaveData) {
      setUsePosterOnly(true);
      return;
    }

    setUsePosterOnly(false);

    // Load video ONLY after first paint and page load
    const startVideoLoad = () => {
      // Small idle defer to guarantee LCP candidate has painted
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => setShouldLoadVideo(true), { timeout: 2000 });
      } else {
        setTimeout(() => setShouldLoadVideo(true), 300);
      }
    };

    if (document.readyState === "complete") {
      startVideoLoad();
    } else {
      window.addEventListener("load", startVideoLoad, { once: true });
      return () => window.removeEventListener("load", startVideoLoad);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo) return;

    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused, shouldLoadVideo]);

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Atmosphere wash */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 65% 55% at 50% 30%, rgba(79, 70, 229, 0.18), transparent 75%)"
            : "radial-gradient(ellipse 65% 55% at 50% 30%, rgba(143, 180, 255, 0.28), transparent 75%)",
        }}
      />

      {/* When restricted (mobile / reduced-motion / save-data) or before video loads: render optimized WebP poster */}
      {usePosterOnly || !shouldLoadVideo ? (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <Image
            src="/candidates/ribbon-poster.webp"
            alt=""
            width={1400}
            height={780}
            priority={false}
            className="w-full h-full object-cover object-center mix-blend-multiply dark:mix-blend-screen opacity-90 transition-opacity"
            style={{
              filter: isDark ? "contrast(1.1) brightness(0.9)" : "contrast(1.05)",
            }}
          />
        </div>
      ) : (
        /* Looping video: mounted strictly after first paint with preload="none" */
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="/candidates/ribbon-poster.webp"
          className="w-full h-full object-cover object-center mix-blend-multiply dark:mix-blend-screen opacity-90 transition-opacity"
          style={{
            filter: isDark ? "contrast(1.1) brightness(0.9)" : "contrast(1.05)",
          }}
        >
          <source src="/candidates/ribbon-loop.webm" type="video/webm" />
          <source src="/candidates/ribbon-loop.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
