"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const applyTheme = (nextDark: boolean) => {
    const nextTheme = nextDark ? "dark" : "light";
    setTheme(nextTheme);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget?.blur();
    const nextDark = !isDark;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // Reduced motion: instant
    if (prefersReduced) {
      applyTheme(nextDark);
      return;
    }

    // Fallback for browsers without View Transitions: a 200ms crossfade
    if (typeof document === "undefined" || !document.startViewTransition) {
      const currentColor =
        getComputedStyle(document.documentElement).getPropertyValue("--background").trim() ||
        (isDark ? "#0F0F0E" : "#FBFBFA");
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.zIndex = "9998";
      overlay.style.pointerEvents = "none";
      overlay.style.backgroundColor = currentColor;
      overlay.style.transition = "opacity 200ms ease-out";
      overlay.style.opacity = "1";
      document.body.appendChild(overlay);

      applyTheme(nextDark);

      requestAnimationFrame(() => {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
        }, 220);
      });
      return;
    }

    // View Transitions API: circular reveal radiating from toggle button center
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        applyTheme(nextDark);
      });
    });

    transition.ready
      .then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration: 450,
            easing: "ease-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {
        // Fallback if animation fails
      });
  };

  if (!mounted) return <div className="h-9 w-9 rounded-full" />;

  return (
    <IconButton
      ref={buttonRef}
      onClick={toggleTheme}
      variant="glass"
      size="md"
      aria-label="Toggle theme"
      className="relative cursor-pointer overflow-hidden"
    >
      <span
        key={isDark ? "dark" : "light"}
        className="flex items-center justify-center text-foreground transition-transform duration-200"
      >
        {isDark ? (
          <Moon className="h-4 w-4 fill-none" strokeWidth={1.75} />
        ) : (
          <Sun className="h-4 w-4 fill-none" strokeWidth={1.75} />
        )}
      </span>
    </IconButton>
  );
}
