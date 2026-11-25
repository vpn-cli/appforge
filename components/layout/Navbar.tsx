"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Apps", href: "/apps" },
  { label: "Builder", href: "/builder/demo" },
  { label: "Templates", href: "/templates" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = NAV_ITEMS.findIndex(
        (seg) => pathname === seg.href || (seg.href === "/apps" && pathname.startsWith("/apps"))
      );
      if (activeIndex !== -1 && linkRefs.current[activeIndex]) {
        const el = linkRefs.current[activeIndex];
        if (el) {
          setIndicatorStyle({
            left: el.offsetLeft,
            width: el.offsetWidth,
            opacity: 1,
          });
          return;
        }
      }
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname]);

  return (
    <header className="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between py-4 border-b border-border relative z-50 bg-background">
      <Link
        href="/"
        className="flex items-center gap-2.5 relative group outline-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-8 h-8 rounded-[10px] bg-foreground text-background flex items-center justify-center shadow-xs transition-colors relative overflow-hidden">
          <AppForgeLogo size={18} isHovered={isHovered} className="text-background relative z-10" />
        </div>
        <div className="font-bold text-lg tracking-tight text-foreground transition-colors">
          AppForge
        </div>
      </Link>

      {/* Desktop Links with Sliding Active Pill (CSS transform transition) */}
      <nav
        ref={navRef}
        aria-label="Navigation"
        className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-surface-sunken/60 border border-border/80 relative"
      >
        {/* Positioned indicator with CSS transform transition */}
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-full bg-surface shadow-xs border border-border/60 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-0"
          style={{
            left: 0,
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
            opacity: indicatorStyle.opacity,
            transitionProperty: "transform, width, opacity",
          }}
        />

        {NAV_ITEMS.map((itemSeg, idx) => {
          const isActive = pathname === itemSeg.href || (itemSeg.href === "/apps" && pathname.startsWith("/apps"));
          return (
            <div key={itemSeg.label}>
              <Link
                ref={(el) => {
                  linkRefs.current[idx] = el;
                }}
                href={itemSeg.href}
                className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors inline-flex items-center z-10 ${
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative z-10">{itemSeg.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Desktop Actions & Mobile Trigger */}
      <div className="flex items-center gap-2 sm:gap-4">
        <SignedIn>
          <div className="flex gap-2 sm:gap-4 items-center">
            <ThemeToggle />
            <OrganizationSwitcher appearance={{ elements: { organizationSwitcherTrigger: "border border-border bg-muted/50 rounded-md py-1.5 px-3 text-sm font-medium text-foreground", organizationPreviewAvatarBox: "bg-muted text-foreground border border-border" } }} />
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 border border-border bg-muted text-foreground" } }} />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
          <div className="hidden sm:block">
            <SignInButton mode="modal" fallbackRedirectUrl="/apps">
              <Button variant="ghost" size="md">
                Log in
              </Button>
            </SignInButton>
          </div>
          <div className="hidden sm:block">
            <SignUpButton mode="modal" fallbackRedirectUrl="/apps">
              <Button variant="primary" size="md">
                Start for free
              </Button>
            </SignUpButton>
          </div>
        </SignedOut>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-background border-border shadow-md border-b flex flex-col md:hidden overflow-hidden origin-top z-40">
          <div className="p-4 flex flex-col gap-3">
            {["Apps", "Builder", "Templates"].map((text) => (
              <Link
                key={text}
                href={text === "Apps" ? "/apps" : text === "Builder" ? "/builder/demo" : `/${text.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-foreground text-sm font-medium p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50"
              >
                {text}
              </Link>
            ))}

            <SignedOut>
              <div className="h-[1px] w-full bg-border/50 my-2" />
              <SignInButton mode="modal" fallbackRedirectUrl="/apps">
                <Button variant="secondary" size="md" className="w-full justify-center">
                  Log in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/apps">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Start for free
                </Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}
