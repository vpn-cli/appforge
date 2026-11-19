"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AppThumbnail } from "@/components/dashboard/AppThumbnail";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { createAppFromTemplate } from "@/actions/apps";
import { ArrowRight, Eye } from "lucide-react";
import { TEMPLATES_DATA, type TemplateItem } from "@/lib/templates-data";

export type { TemplateItem };

const CATEGORIES = ["All", "Operations", "Organization", "Scratch"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

export function TemplatesView() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") return TEMPLATES_DATA;
    return TEMPLATES_DATA.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 select-none">
      {/* Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
            Templates
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Starter configurations to jumpstart your internal tools.
          </p>
        </div>

        {/* Category filter pills: All / Operations / Organization / Scratch */}
        <div
          role="tablist"
          aria-label="Filter templates by category"
          className="inline-flex items-center p-1 rounded-full bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 self-start sm:self-auto"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-surface text-brand-link shadow-[0_2px_8px_rgba(23,23,31,0.08)] dark:bg-white/[0.14] font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Templates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="group rounded-2xl bg-card border border-border/80 dark:border-white/10 hover:border-slate-400/50 dark:hover:border-white/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between"
          >
            {/* Live cropped thumbnail at top with bottom fade */}
            <AppThumbnail config={tpl.config} />

            {/* Below Thumbnail Body */}
            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
              <div>
                {/* Category tag pill */}
                <div className="flex items-center justify-between mb-2.5">
                  <StatusPill variant="neutral" showDot={false}>
                    {tpl.category}
                  </StatusPill>
                </div>

                {/* Title: 17/600 */}
                <h2 className="text-[17px] font-semibold text-foreground tracking-tight">
                  {tpl.title}
                </h2>

                {/* Description: 14 */}
                <p className="text-[14px] text-muted-foreground mt-1.5 leading-normal">
                  {tpl.description}
                </p>

                {/* Meta: muted 13 */}
                <p className="text-[13px] text-muted-foreground/80 mt-2.5 font-normal">
                  {tpl.componentsCount} components · {tpl.entitiesCount} {tpl.entitiesCount === 1 ? "entity" : "entities"}
                </p>
              </div>

              {/* Actions row: Preview (secondary sm) + Use template (primary sm) on ONE row */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-border/60 dark:border-white/5 mt-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  render={<Link href={`/builder/demo?template=${tpl.id}`} />}
                  className="flex-1 justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Button>

                <form
                  action={createAppFromTemplate.bind(null, tpl.id)}
                  className="flex-1"
                >
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full justify-center gap-1.5"
                  >
                    <span>Use template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
