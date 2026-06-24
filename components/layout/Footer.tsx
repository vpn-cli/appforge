import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-10 bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-text-primary">
            AppForge
          </span>
          <span className="text-text-secondary text-sm">
            Metadata-driven application runtime.
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="text-text-secondary text-sm hover:text-text-primary">
            Terms
          </Link>
          <Link href="/privacy" className="text-text-secondary text-sm hover:text-text-primary">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
