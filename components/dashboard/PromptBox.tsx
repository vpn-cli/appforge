"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, CornerDownLeft, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createApp } from "@/actions/apps";

type Props = {
  variant?: "linear" | "vercel";
  onPlainCreate?: () => void;
  isPending?: boolean;
};

const examplePrompts = [
  "Customer onboarding portal with verification steps",
  "Fleet telemetry with depot maintenance holds",
  "Incident response board with SLA warnings",
];

export function PromptBox({ variant = "linear", onPlainCreate, isPending }: Props) {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const targetPrompt = (customPrompt ?? prompt).trim();
    if (!targetPrompt || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createApp(targetPrompt);
    } catch {
      // In bypass or fallback, navigate directly with query param
      router.push(`/builder/mock-new-id?prompt=${encodeURIComponent(targetPrompt)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    handleGenerate(undefined, example);
  };

  if (variant === "linear") {
    return (
      <div className="w-full bg-card border border-border rounded-lg p-3 sm:p-4 transition-colors">
        <form onSubmit={handleGenerate} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 relative">
            <Sparkles className="w-4 h-4 text-brand shrink-0 ml-1" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the app you want to build..."
              disabled={isSubmitting || isPending}
              className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none h-9 pr-2"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="submit"
                disabled={!prompt.trim() || isSubmitting || isPending}
                size="sm"
                className="h-8 px-3 bg-brand hover:bg-brand-dark text-text-inverse font-medium text-xs rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Generate</span>
                    <kbd className="hidden sm:inline-block font-mono text-[10px] bg-black/20 dark:bg-white/20 px-1 py-0.5 rounded text-white">
                      ↵
                    </kbd>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] mr-1">Examples:</span>
              {examplePrompts.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border/50 px-2 py-0.5 rounded transition-colors text-left truncate max-w-[280px] sm:max-w-none"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <Link
                href="/templates"
                className="text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1 hover:underline underline-offset-4 transition-colors"
              >
                <span>Start from a template</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Direction 2: Vercel Workspace AI Cockpit
  return (
    <div className="w-full bg-card border border-border rounded-xl p-5 shadow-xs transition-colors">
      <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the app you want to build..."
              disabled={isSubmitting || isPending}
              className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-background border border-border focus:border-brand rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="submit"
              disabled={!prompt.trim() || isSubmitting || isPending}
              className="h-10 px-5 bg-brand hover:bg-brand-dark text-text-inverse font-medium text-xs sm:text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </Button>

            {onPlainCreate && (
              <Button
                type="button"
                variant="outline"
                onClick={onPlainCreate}
                disabled={isSubmitting || isPending}
                className="h-10 px-3 border-border hover:bg-muted text-foreground text-xs rounded-lg"
                title="Create blank app without prompt"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-1">New app</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Try:</span>
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="text-xs text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-md border border-border/40 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>

          <Link
            href="/templates"
            className="text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-1 hover:underline underline-offset-4 ml-auto"
          >
            <span>Start from a template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </form>
    </div>
  );
}
