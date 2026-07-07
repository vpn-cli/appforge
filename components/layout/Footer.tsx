import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-10 bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-foreground">
            AppForge
          </span>
          <span className="text-muted-foreground text-sm">
            Metadata-driven application runtime.
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="text-muted-foreground text-sm hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="text-muted-foreground text-sm hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

