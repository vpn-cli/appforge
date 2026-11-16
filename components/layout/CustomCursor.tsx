"use client";

import AnimatedCursor from "react-animated-cursor";
import { useState, useEffect } from "react";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(max-width: 768px)").matches;

    setIsTouchDevice(isTouch);
    setMounted(true);

    // Hide native cursor while on landing page
    if (!isTouch) {
      document.body.style.cursor = "none";
    }

    return () => {
      // Restore native cursor completely on unmount
      document.body.style.cursor = "";
      document.body.style.removeProperty("cursor");
      document.documentElement.style.cursor = "";
      document.documentElement.style.removeProperty("cursor");

      const elementsWithInlineCursor = document.querySelectorAll<HTMLElement>("[style*='cursor']");
      elementsWithInlineCursor.forEach((el) => {
        if (el.style.cursor === "none") {
          el.style.cursor = "";
          el.style.removeProperty("cursor");
        }
      });
    };
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
      showSystemCursor={true}
      innerStyle={{
        zIndex: 999999,
      }}
      outerStyle={{
        zIndex: 999999,
      }}
      clickables={[
        "a",
        "button",
        ".link",
        "[data-cursor]",
      ]}
    />
  );
}
