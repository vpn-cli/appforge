"use client";

import { useEffect, useRef } from "react";

type Props = {
  isDark?: boolean;
  isPaused?: boolean;
};

interface AuroraBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function CandidateBAurora({ isDark = false, isPaused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Aurora colors adapted to AppForge tokens
    const lightColors = [
      "hsla(245, 80%, 75%, 0.38)",
      "hsla(220, 85%, 78%, 0.35)",
      "hsla(270, 75%, 80%, 0.32)",
      "hsla(205, 90%, 82%, 0.28)",
    ];

    const darkColors = [
      "hsla(250, 75%, 55%, 0.24)",
      "hsla(225, 80%, 50%, 0.22)",
      "hsla(280, 70%, 45%, 0.20)",
      "hsla(210, 85%, 48%, 0.18)",
    ];

    const currentPalette = isDark ? darkColors : lightColors;

    // Create blobs for aurora waves
    const blobs: AuroraBlob[] = [
      { x: width * 0.25, y: height * 0.3, vx: 0.25, vy: 0.15, radius: Math.min(width, height) * 0.55, color: currentPalette[0] },
      { x: width * 0.7, y: height * 0.4, vx: -0.2, vy: 0.18, radius: Math.min(width, height) * 0.6, color: currentPalette[1] },
      { x: width * 0.5, y: height * 0.65, vx: 0.18, vy: -0.22, radius: Math.min(width, height) * 0.5, color: currentPalette[2] },
      { x: width * 0.85, y: height * 0.2, vx: -0.15, vy: -0.12, radius: Math.min(width, height) * 0.45, color: currentPalette[3] },
    ];

    let t = 0;
    const render = () => {
      if (isPaused) return;

      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Base atmospheric fill
      ctx.fillStyle = isDark ? "#09090B" : "#F8F9FD";
      ctx.fillRect(0, 0, width, height);

      // Composite aurora blobs
      ctx.globalCompositeOperation = isDark ? "screen" : "multiply";

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        // Swirling drift
        const curX = b.x + Math.sin(t + i) * 60;
        const curY = b.y + Math.cos(t * 1.2 + i * 1.5) * 45;

        const grad = ctx.createRadialGradient(curX, curY, 0, curX, curY, b.radius);
        grad.addColorStop(0, b.color);
        grad.addColorStop(0.5, b.color.replace(/[\d.]+\)$/, "0.12)"));
        grad.addColorStop(1, "transparent");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(curX, curY, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDark, isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block absolute inset-0 pointer-events-none"
      style={{ filter: "blur(40px)", transform: "scale(1.1)" }}
    />
  );
}
