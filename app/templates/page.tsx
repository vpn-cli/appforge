import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { createInsforgeServer } from "@/lib/insforge-server";
import { createAppFromTemplate } from "@/actions/apps";
import { ArrowRight, LayoutTemplate, Database, FileCode2 } from "lucide-react";

export default async function TemplatesPage() {
  const supabase = await createInsforgeServer();
  await supabase.auth.getUser();

  const templates = [
    {
      id: "crm",
      title: "Analytics CRM",
      description: "Pipeline metrics, conversion rates, and searchable lead table.",
      tag: "Operations",
      icon: Database,
    },
    {
      id: "directory",
      title: "Employee Directory",
      description: "Corporate directory with team cards, roles, and quick profiles.",
      tag: "Organization",
      icon: LayoutTemplate,
    },
    {
      id: "blank",
      title: "Blank Canvas",
      description: "Start from a clean slate and build with JSON or the Gemini Copilot.",
      tag: "Scratch",
      icon: FileCode2,
    },
  ];

  return (
    <AppShell>
      {/* Same max-w-[1200px] container width and padding as Apps page */}
      <div className="w-full max-w-[1200px] mx-auto px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
            Templates
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Starter configurations to jumpstart your internal tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.id}
                className="rounded-2xl bg-card dark:bg-[#14141A] border border-border dark:border-white/10 hover:border-slate-400/50 dark:hover:border-white/25 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between p-5 h-full"
              >
                <div>
                  {/* Top row: 40px icon tile + Category badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full glass-3-tile flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <StatusPill variant="neutral" showDot={false}>
                      {tpl.tag}
                    </StatusPill>
                  </div>

                  {/* Title: 17/600 */}
                  <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
                    {tpl.title}
                  </h3>

                  {/* Description: 14 at readable contrast */}
                  <p className="text-[14px] text-muted-foreground mt-1.5 leading-normal">
                    {tpl.description}
                  </p>
                </div>

                {/* Bottom: Use template full-width secondary button */}
                <div className="pt-6">
                  <form action={createAppFromTemplate.bind(null, tpl.id)} className="w-full">
                    <Button
                      type="submit"
                      variant="secondary"
                      size="md"
                      className="w-full justify-center gap-2"
                    >
                      <span>Use template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
