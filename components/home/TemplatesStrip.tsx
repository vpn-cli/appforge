import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { TEMPLATES_DATA } from "@/lib/templates-data";
import { TemplateThumbnail } from "./TemplateThumbnail";

const FEATURED_TEMPLATES = TEMPLATES_DATA.filter((tpl) => tpl.id !== "blank").slice(0, 3);

export function TemplatesStrip() {
  return (
    <section
      aria-labelledby="templates-strip-heading"
      className="w-full py-16 sm:py-24 relative z-10 border-t border-border"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="max-w-xl">
            <h2
              id="templates-strip-heading"
              className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.15] text-foreground"
            >
              Start from a starter config
            </h2>
            <p className="text-[15px] text-text-secondary mt-2 leading-[1.55]">
              Live component registry renders from the starter JSON templates.
            </p>
          </div>

          <Button
            render={<Link href="/templates" prefetch={false} />}
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
              href={`/builder/demo?template=${tpl.id}`}
              prefetch={false}
              className="group rounded-2xl bg-card border border-border hover:border-border-strong overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <TemplateThumbnail config={tpl.config} />

              <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                <div>
                  <div className="mb-3">
                    <StatusPill variant="neutral" showDot={false}>
                      {tpl.category}
                    </StatusPill>
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-1.5 group-hover:text-brand-link transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-[14px] leading-[1.55] text-text-secondary">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-border flex items-center justify-between text-[13px] text-muted-foreground">
                  <span className="font-mono">
                    {tpl.componentsCount} components · {tpl.entitiesCount}{" "}
                    {tpl.entitiesCount === 1 ? "entity" : "entities"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-brand-link">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
