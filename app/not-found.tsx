import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[13px] font-mono font-medium bg-muted text-muted-foreground border border-border mb-4">
          404 Error
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
          The requested page could not be located. It may have been moved, renamed, or does not exist in this environment.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" className="h-9 px-4 text-sm border-border hover:bg-muted">
              Return Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="h-9 px-4 text-sm bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground">
              Dashboard
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

