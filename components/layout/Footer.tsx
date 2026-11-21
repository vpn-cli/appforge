import Link from "next/link";
import { AppForgeLogo } from "@/components/ui/appforge-logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/60 dark:border-white/10 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full flex flex-col sm:flex-row items-center justify-between py-[48px] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-white/10 dark:text-white flex items-center justify-center shadow-xs">
            <AppForgeLogo size={15} className="text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-[14px] text-slate-900 dark:text-slate-100 tracking-tight">
              AppForge
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[14px]">
              — Metadata-driven application runtime.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/terms"
            className="text-slate-600 dark:text-slate-400 text-[14px] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-slate-600 dark:text-slate-400 text-[14px] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
