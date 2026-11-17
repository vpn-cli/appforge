"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IconButton } from "@/components/ui/icon-button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Initialize state from DOM (which was set by our layout script)
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
    const nextDark = !isDark;

    // Fallback if browser doesn't support View Transitions API natively
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
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  // Prevent hydration mismatch on the icon (36px x 36px)
  if (!mounted) return <div className="h-9 w-9 rounded-full" />;

  return (
    <IconButton
      onClick={toggleTheme}
      variant="glass"
      size="md"
      aria-label="Toggle theme"
      className="relative cursor-pointer"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "backOut" }}
            className="flex items-center justify-center text-slate-200"
          >
            {/* Neutral glass circle with NO blue fill */}
            <Moon className="h-4 w-4 fill-none" strokeWidth={1.75} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.25, ease: "backOut" }}
            className="flex items-center justify-center text-slate-700"
          >
            <Sun className="h-4 w-4 fill-none" strokeWidth={1.75} />
          </motion.div>
        )}
      </AnimatePresence>
    </IconButton>
  );
}
