import Link from "next/link";
import { AppForgeLogo } from "@/components/ui/appforge-logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-border mt-auto bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex flex-col sm:flex-row items-center justify-between py-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center shadow-xs shrink-0">
            <AppForgeLogo size={15} className="text-background" />
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-semibold text-[14px] text-foreground tracking-tight">
              AppForge
            </span>
            <span className="text-text-secondary text-[14px]">
              — Metadata-driven application runtime.
            </span>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="flex items-center gap-6">
          <Link
            href="/templates"
            className="text-text-secondary text-[14px] hover:text-foreground transition-colors"
          >
            Templates
          </Link>
          <Link
            href="/terms"
            className="text-text-secondary text-[14px] hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-text-secondary text-[14px] hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
