"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MOTION_TOKENS } from "@/lib/motion-tokens";
import { Menu, X } from "lucide-react";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";

const DynamicSignedInControls = dynamic(
  () => import("./HomeTopBarSignedIn").then((mod) => mod.HomeTopBarSignedIn),
  { ssr: false }
);

const NAV_SEGMENTS = [
  { label: "Apps", href: "/apps" },
  { label: "Builder", href: "/builder/demo" },
  { label: "Templates", href: "/templates" },
] as const;

export function HomeTopBar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isUserSignedIn = Boolean(isLoaded && isSignedIn);

  return (
    <header className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 relative z-30 shrink-0">
      <div className="h-16 px-4 sm:px-6 w-full flex items-center justify-between rounded-full glass-1 transition-colors">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 outline-none group select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-[10px] bg-foreground text-background flex items-center justify-center shadow-xs transition-colors">
            <AppForgeLogo size={18} className="text-background" />
          </div>
          <span className="font-semibold text-[15px] sm:text-[16px] tracking-tight text-foreground">
            AppForge
          </span>
        </Link>

        {/* Desktop Nav with Sliding Active Pill */}
        <nav
          aria-label="Primary navigation"
          className="hidden sm:flex items-center p-1 rounded-full bg-surface-sunken border border-border relative"
        >
          {NAV_SEGMENTS.map((seg) => {
            const isActive = pathname === seg.href || (seg.href === "/apps" && pathname.startsWith("/apps"));
            return (
              <Link
                key={seg.label}
                href={seg.href}
                prefetch={false}
                className={`relative px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? "text-brand-link font-semibold"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-sliding-pill"
                    className="absolute inset-0 rounded-full bg-surface shadow-xs z-0"
                    transition={MOTION_TOKENS.springStandard}
                  />
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-link shrink-0 relative z-10" />
                )}
                <span className="relative z-10">{seg.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isUserSignedIn ? (
            <DynamicSignedInControls />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                render={<Link href="/sign-in" prefetch={false} />}
                variant="ghost"
                size="md"
                className="text-foreground hover:text-foreground"
              >
                Log in
              </Button>
              <Button
                render={<Link href="/sign-up" prefetch={false} />}
                variant="primary"
                size="md"
              >
                Start for free
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <IconButton
            variant="glass"
            size="md"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="sm:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </IconButton>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 p-4 rounded-2xl glass-1 flex flex-col gap-2 shadow-lg">
          {NAV_SEGMENTS.map((seg) => {
            const isActive = pathname === seg.href;
            return (
              <Link
                key={seg.label}
                href={seg.href}
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-xl text-[15px] font-medium transition-colors ${
                  isActive
                    ? "bg-surface text-brand-link font-semibold"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {seg.label}
              </Link>
            );
          })}
          {!isUserSignedIn && (
            <div className="pt-2 mt-1 border-t border-border flex flex-col gap-2">
              <Button
                render={<Link href="/sign-in" prefetch={false} />}
                variant="secondary"
                size="md"
                className="w-full justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Button>
              <Button
                render={<Link href="/sign-up" prefetch={false} />}
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start for free
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
