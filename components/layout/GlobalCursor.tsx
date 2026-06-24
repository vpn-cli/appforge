"use client";

import { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { motion, useMotionValue } from "framer-motion";

export function GlobalCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorType, setCursorType] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      // Inspect what we are hovering over to magically alter the cursor
      const target = e.target as HTMLElement | null;
      if (target) {
        const customCursorContainer = target.closest('[data-cursor]');
        if (customCursorContainer) {
          setCursorType(customCursorContainer.getAttribute('data-cursor'));
        } else {
          setCursorType(null);
        }
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Inject global styles to brutally enforce cursor hiding on all current and future elements
    const style = document.createElement('style');
    style.innerHTML = `
      * { cursor: none !important; }
      /* Maintain text-selection pointer for inputs */
      input, textarea, [contenteditable="true"] { cursor: text !important; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.head.removeChild(style);
    };
  }, [mouseX, mouseY, isVisible]);

  // Visuals depending on cursor type
  const isHero = cursorType === 'hero';

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9999] flex items-center justify-center filter drop-shadow-md"
      style={{
        x: mouseX,
        y: mouseY,
        translateX: "-20%", 
        translateY: "-20%",
        opacity: isVisible ? 1 : 0,
      }}
      animate={{ 
        scale: isClicking ? (isHero ? 0.9 : 0.85) : (isHero ? 1.5 : 1),
      }}
      transition={{ scale: { duration: 0.15, type: "spring", stiffness: 400, damping: 25 } }}
    >
      <MousePointer2 
        size={isHero ? 36 : 24} 
        className={`transition-colors duration-300 -rotate-6 ${
          isHero 
            ? "fill-brand text-surface drop-shadow-[0_8px_16px_rgba(108,87,164,0.4)]" 
            : "fill-text-primary text-surface"
        }`} 
        strokeWidth={isHero ? 1.5 : 2} 
      />
    </motion.div>
  );
}
