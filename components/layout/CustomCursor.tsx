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
      
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouchDevice(isTouch);

    setMounted(true);
  }, []);

  if (!mounted || isTouchDevice) return null;

  return (
    <AnimatedCursor
      innerSize={8}
      outerSize={36}
      color="109, 40, 217"
      outerAlpha={0.2}
      innerScale={0.7}
      outerScale={1.4}
      innerStyle={{
        zIndex: 999999
      }}
      outerStyle={{
        zIndex: 999999
      }}
      clickables={[
        'a',
        'button',
        '.link',
        '[data-cursor]'
      ]}
    />
  );
}
