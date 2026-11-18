import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";

const FEATURED_TEMPLATES = [
  {
    id: "crm",
    category: "Operations",
    title: "Analytics CRM",
    description:
      "Pipeline statistics and a lead table backed by leads and activities entities.",
    meta: "6 components · 2 entities",
  },
  {
    id: "incident",
    category: "Operations",
    title: "Incident Command Center",
    description:
      "Service health counters and an incident status table backed by an incidents entity.",
    meta: "6 components · 1 entity",
  },
  {
    id: "directory",
    category: "Organization",
    title: "Employee Directory",
    description:
      "Headcount overview and searchable personnel directory backed by an employees entity.",
    meta: "5 components · 1 entity",
  },
] as const;

export function TemplatesStrip() {
  return (
    <section
      aria-labelledby="templates-strip-heading"
      className="w-full py-16 sm:py-20 relative z-10"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="max-w-xl">
            <p className="type-label text-brand-link mb-2">Templates</p>
            <h2
              id="templates-strip-heading"
              className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.15] text-foreground"
            >
              Start from a starter config
            </h2>
          </div>

          <Button
            render={<Link href="/templates" />}
            variant="secondary"
            size="md"
            showArrow
          >
            <span>Browse all templates</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.id}
              href="/templates"
              className="group rounded-2xl bg-card border border-border hover:border-border-strong p-6 flex flex-col justify-between gap-4 transition-colors"
            >
              <div>
                <div className="mb-3">
                  <StatusPill variant="neutral" showDot={false}>
                    {tpl.category}
                  </StatusPill>
                </div>
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-2 group-hover:text-brand-link transition-colors">
                  {tpl.title}
                </h3>
                <p className="text-[15px] leading-[1.55] text-text-secondary">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-[13px] text-text-muted">
                <span className="font-mono">{tpl.meta}</span>
                <span className="inline-flex items-center gap-1 font-medium text-brand-link">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
