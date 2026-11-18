"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const applyTheme = (nextDark: boolean) => {
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  };

  const toggleTheme = (event: React.MouseEvent) => {
    (event.currentTarget as HTMLElement)?.blur();
    const nextDark = !isDark;

    if (!document.startViewTransition) {
      applyTheme(nextDark);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      applyTheme(nextDark);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        { clipPath },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  if (!mounted) return <div className="h-9 w-9 rounded-full" />;

  return (
    <IconButton
      onClick={toggleTheme}
      variant="glass"
      size="md"
      aria-label="Toggle theme"
      className="relative cursor-pointer"
    >
      <span className="flex items-center justify-center text-foreground transition-transform duration-200">
        {isDark ? (
          <Moon className="h-4 w-4 fill-none" strokeWidth={1.75} />
        ) : (
          <Sun className="h-4 w-4 fill-none" strokeWidth={1.75} />
        )}
      </span>
    </IconButton>
  );
}
