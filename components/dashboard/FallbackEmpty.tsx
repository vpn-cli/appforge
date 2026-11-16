"use client";

import Link from "next/link";
import { FolderPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createApp } from "@/actions/apps";
import { useTransition } from "react";

export function FallbackEmpty() {
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (isPending) return;
    startTransition(() => {
      createApp();
    });
  };

  return (
    <div className="w-full min-h-[300px] bg-card/10 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner">
        <FolderPlus className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-1">No apps yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6 text-sm">
        Create one from a prompt or{" "}
        <Link href="/templates" className="text-brand hover:underline underline-offset-4 font-medium">
          start from a template
        </Link>.
      </p>
      <Button 
        onClick={handleCreate} 
        disabled={isPending}
        className="bg-brand hover:bg-brand-dark text-text-inverse font-medium transition-colors px-6 py-2 h-9"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <FolderPlus className="w-4 h-4 mr-2" />
            Create App
          </>
        )}
      </Button>
    </div>
  );
}
