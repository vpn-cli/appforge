"use client";

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
      <h3 className="text-xl font-bold text-foreground mb-2">No Applications Found</h3>
      <p className="text-muted-foreground max-w-sm mb-6 text-sm">
        Your workspace is completely empty. Initiate your first project instance to begin leveraging the AppForge engine.
      </p>
      <Button 
        onClick={handleCreate} 
        disabled={isPending}
        className="bg-brand hover:bg-brand-dark text-white font-semibold transition-all px-6 py-2 shadow-lg shadow-brand/10 h-10"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Booting Template...
          </>
        ) : (
          <>
            <FolderPlus className="w-4 h-4 mr-2" />
            Initialize First App
          </>
        )}
      </Button>
    </div>
  );
}
