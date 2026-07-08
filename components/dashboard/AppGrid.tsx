"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, ExternalLink, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { createApp } from "@/actions/apps";
import { useTransition } from "react";

type AppData = {
  id: string;
  name: string;
  updated_at: string;
  status: string;
};

function getRelativeTime(dateStr: string) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffHours = Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60));
  if (diffHours === 0) return 'just now';
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(Math.round(diffHours / 24), 'day');
}

export function AppGrid({ initialApps }: { initialApps: AppData[] }) {
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (isPending) return;
    startTransition(() => {
      createApp();
    });
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
      {/* Create New App Button */}
      <Card 
        onClick={handleCreate}
        className="bg-card/50 border-dashed border-2 border-border hover:border-brand/60 hover:bg-card transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] group shadow-none"
      >
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-brand group-hover:text-white transition-colors shadow-sm">
          {isPending ? (
            <Loader2 className="h-7 w-7 text-muted-foreground group-hover:text-white animate-spin" />
          ) : (
            <Plus className="h-7 w-7 text-muted-foreground group-hover:text-white transition-colors" />
          )}
        </div>
        <CardTitle className="text-lg font-bold text-foreground group-hover:text-brand transition-colors">
          {isPending ? "Setting up..." : "Create New App"}
        </CardTitle>
        <CardDescription className="text-center mt-2 px-6 text-sm">
          Start building instantly from a blank JSON config.
        </CardDescription>
      </Card>

      {/* Render actual apps */}
      {initialApps.map((app) => (
        <Card key={app.id} className="bg-card border-border hover:shadow-xl hover:shadow-brand/5 hover:border-brand/30 transition-all duration-300 flex flex-col group overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold text-foreground mb-1.5">{app.name}</CardTitle>
                <div className="flex items-center text-xs text-muted-foreground font-medium">
                  <Clock className="w-3 h-3 mr-1.5 opacity-70" />
                  Edited {getRelativeTime(app.updated_at)}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                app.status === 'Published' 
                  ? 'bg-brand/10 text-brand border border-brand/20 shadow-brand/10' 
                  : 'bg-accent text-muted-foreground border border-border'
              }`}>
                {app.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-5">
            <div className="h-20 w-full rounded-md bg-background border border-white/5 flex items-center justify-center text-[11px] text-muted-foreground/50 font-mono shadow-inner overflow-hidden relative">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '12px 12px' }} />
              <div className="relative flex flex-col items-center">
                 <span className="text-brand/30 mb-1 opacity-50">&lt;/&gt;</span>
                 app.config.json
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-5 px-5 flex gap-3">
            <Link href={`/builder/${app.id}`} className="w-full flex-1">
              <Button variant="outline" className="w-full bg-card hover:bg-muted border-border font-medium text-xs h-9">
                <Settings2 className="w-3.5 h-3.5 mr-2" />
                Builder
              </Button>
            </Link>
            {app.status === 'Published' && (
              <Link href={`/apps/${app.id}`} className="w-full flex-1">
                <Button className="w-full bg-brand hover:bg-brand-dark shadow-md shadow-brand/20 font-medium text-xs h-9 text-white">
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Run App
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

