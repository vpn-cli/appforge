import { MessageSquareCode, FileCheck2, Database } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Describe",
    description:
      "Prompt the Builder Copilot in plain English or edit app.config.json directly in the Monaco editor.",
    icon: MessageSquareCode,
  },
  {
    step: "02",
    title: "Config",
    description:
      "Every component node is validated against per-component Zod schemas. Invalid nodes render isolated fallbacks instead of crashing the page.",
    icon: FileCheck2,
  },
  {
    step: "03",
    title: "Running app with database",
    description:
      "Publishing syncs entity schemas into scoped Postgres tables and exposes CRUD routes through /api/proxy/[appId]/[entity].",
    icon: Database,
  },
] as const;

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="w-full py-16 sm:py-20 relative z-10"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
        <div className="max-w-2xl mb-10">
          <p className="type-label text-brand-link mb-2">How it works</p>
          <h2
            id="how-it-works-heading"
            className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.15] text-foreground"
          >
            From description to a backed application
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="rounded-2xl bg-card border border-border p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-light border border-border flex items-center justify-center text-brand-link">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-[13px] text-text-muted">
                    {item.step}
                  </span>
                </div>

                <div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[15px] leading-[1.55] text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
