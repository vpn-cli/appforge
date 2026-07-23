"use client";

import AnimatedCursor from "react-animated-cursor";
import { useState, useEffect } from "react";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(max-width: 768px)").matches;
      
    setIsTouchDevice(isTouch);
    setMounted(true);
  }, []);

  if (!mounted || isTouchDevice) return null;

  return (
    <AnimatedCursor
      innerSize={10}
      outerSize={40}
      color="156, 135, 218"
      outerAlpha={0.2}
      innerScale={0.7}
      outerScale={1.5}
      innerStyle={{
        zIndex: 999999
      }}
      outerStyle={{
        zIndex: 999999
      }}
      clickables={[
        'a',
        'input[type="text"]',
        'input[type="email"]',
        'input[type="number"]',
        'input[type="submit"]',
        'input[type="image"]',
        'label[for]',
        'select',
        'textarea',
        'button',
        '.link',
        '[data-cursor]'
      ]}
    />
  );
}
