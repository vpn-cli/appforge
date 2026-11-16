import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <div className="w-full max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Starter configurations to jumpstart your internal tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <Card
                key={tpl.id}
                className="bg-card border-border hover:border-foreground/30 transition-colors flex flex-col justify-between"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground">
                      <Icon className="w-4 h-4 text-brand" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                      {tpl.tag}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {tpl.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    {tpl.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form action={createAppFromTemplate.bind(null, tpl.id)}>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full text-xs font-medium h-8 border-border hover:bg-muted justify-between"
                    >
                      <span>Use template</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
