"use client";

import { useEffect, useRef } from "react";

type Props = {
  isDark?: boolean;
  isPaused?: boolean;
};

export function CandidateDVideo({ isDark = false, isPaused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused]);

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

      {/* Looping video of slowly rotating glass ribbon */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/candidates/ribbon-poster.webp"
        className="w-full h-full object-cover object-center mix-blend-multiply dark:mix-blend-screen opacity-90 transition-opacity"
        style={{
          filter: isDark ? "contrast(1.1) brightness(0.9)" : "contrast(1.05)",
        }}
      >
        <source src="/candidates/ribbon-loop.webm" type="video/webm" />
        <source src="/candidates/ribbon-loop.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
