"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { useOrganization, useUser, UserButton } from "@clerk/nextjs";

const NAV_SEGMENTS = [
  { label: "Apps", href: "/dashboard" },
  { label: "Builder", href: "/builder/demo" },
  { label: "Templates", href: "/templates" },
] as const;

export function HomeTopBar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user, isLoaded, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isUserSignedIn = Boolean(isLoaded && isSignedIn);
  const orgName =
    organization?.name ||
    (user?.fullName ? `${user.fullName}'s Workspace` : "Workspace");
  const orgInitial = (orgName[0] || "A").toUpperCase();

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

        {/* Desktop Nav */}
        <nav
          aria-label="Primary navigation"
          className="hidden sm:flex items-center p-1 rounded-full bg-surface-sunken border border-border"
        >
          {NAV_SEGMENTS.map((seg) => {
            const isActive = pathname === seg.href;
            return (
              <Link
                key={seg.label}
                href={seg.href}
                className={`px-4 py-1.5 rounded-full text-[14px] font-medium transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? "bg-surface text-brand-link shadow-xs font-semibold"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-link shrink-0" />
                )}
                <span>{seg.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isUserSignedIn ? (
            <>
              <div className="hidden md:flex items-center gap-2 pl-1.5 pr-3 h-9 rounded-full glass-2-nested text-foreground select-none">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-primary-foreground font-semibold text-[12px] flex items-center justify-center shrink-0">
                  {orgInitial}
                </span>
                <span className="truncate max-w-[160px] font-medium text-[14px] text-foreground">
                  {orgName}
                </span>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "w-9 h-9 rounded-full border border-border",
                  },
                }}
              />
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                render={<Link href="/sign-in" />}
                variant="ghost"
                size="md"
                className="text-foreground hover:text-foreground"
              >
                Log in
              </Button>
              <Button
                render={<Link href="/sign-up" />}
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
                render={<Link href="/sign-in" />}
                variant="secondary"
                size="md"
                className="w-full justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Button>
              <Button
                render={<Link href="/sign-up" />}
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
