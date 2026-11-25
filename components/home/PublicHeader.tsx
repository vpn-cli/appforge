"use client";

import Link from "next/link";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function PublicHeader() {
  return (
    <header className="h-[72px] max-w-[1240px] mx-auto px-6 w-full flex items-center justify-between border-b border-border relative z-30 transition-colors">
      <Link href="/" className="flex items-center gap-2.5 outline-none group">
        <div className="w-8 h-8 rounded-[10px] bg-foreground text-background flex items-center justify-center shadow-xs transition-colors shrink-0">
          <AppForgeLogo size={18} className="text-background" />
        </div>
        <span className="font-semibold text-lg tracking-tight text-foreground">
          AppForge
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <SignInButton mode="modal" fallbackRedirectUrl="/apps">
          <Button variant="ghost" size="md">
            Log in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal" fallbackRedirectUrl="/apps">
          <Button variant="primary" size="md">
            Start for free
          </Button>
        </SignUpButton>
      </div>
    </header>
  );
}
