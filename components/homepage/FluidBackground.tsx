"use client";
import { useEffect, useRef } from "react";

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = parent.clientWidth;
    let height = parent.clientHeight;

    const setSize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", setSize);
    setSize();

    // Time multiplier for mathematical fluid oscillation
    let time = 0;

    const render = () => {
      time += 0.003;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "screen";

      // Mathematical sine-wave computed liquid physics
      const blobs = [
        {
          x: width * 0.4 + Math.sin(time) * width * 0.2,
          y: height * 0.3 + Math.cos(time * 0.8) * height * 0.2,
          r: width * 0.4,
          color: "rgba(156, 135, 218, 0.6)" // Brand Primary
        },
        {
          x: width * 0.6 + Math.cos(time * 1.2) * width * 0.25,
          y: height * 0.7 + Math.sin(time * 0.9) * height * 0.2,
          r: width * 0.35,
          color: "rgba(39, 201, 63, 0.15)"  // Success Neon Accent
        },
        {
          x: width * 0.3 + Math.sin(time * 0.7) * width * 0.15,
          y: height * 0.6 + Math.cos(time * 1.1) * height * 0.25,
          r: width * 0.3,
          color: "rgba(108, 87, 164, 0.5)"  // Brand Dark
        }
      ];

      blobs.forEach(blob => {
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-80">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ filter: "blur(100px)" }}
      />
    </div>
  );
}
