"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = (event: React.MouseEvent) => {
    (event.currentTarget as HTMLElement)?.blur();
    const nextDark = !isDark;

    if (!document.startViewTransition) {
      applyTheme(nextDark);
      return;
    }

    document.startViewTransition(() => {
      applyTheme(nextDark);
    });
  };

  if (!mounted) return <div className="h-9 w-9 rounded-full" />;

  return (
    <IconButton
      onClick={toggleTheme}
      variant="glass"
      size="md"
      aria-label="Toggle theme"
      className="relative cursor-pointer overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "dark" : "light"}
          initial={{ rotate: -90, opacity: 0, scale: 0.75 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.2, ease: [0.15, 0, 0.2, 1] }}
          className="flex items-center justify-center text-foreground"
        >
          {isDark ? (
            <Moon className="h-4 w-4 fill-none" strokeWidth={1.75} />
          ) : (
            <Sun className="h-4 w-4 fill-none" strokeWidth={1.75} />
          )}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
