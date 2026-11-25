"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createApp } from "@/actions/apps";

type Props = {
  onPlainCreate?: () => void;
  isPending?: boolean;
  appCount?: number;
};

const examplePrompts = [
  "Customer onboarding portal with verification steps",
  "Fleet telemetry with depot maintenance holds",
  "Incident response board with SLA warnings",
];

export function PromptBox({ isPending }: Props) {
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

  const hasText = prompt.trim().length > 0;

  return (
    <div className="w-full flex flex-col rounded-[20px] glass-1 shadow-lg border border-border transition-all overflow-hidden">
      {/* Primary Input Row: 64px tall */}
      <form
        onSubmit={handleGenerate}
        className="w-full h-16 px-4 sm:px-5 flex items-center gap-3"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the app you want to build..."
          disabled={isSubmitting || isPending}
          className="flex-1 bg-transparent text-[15px] sm:text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none h-full tracking-tight font-normal"
        />

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="submit"
            disabled={!hasText || isSubmitting || isPending}
            variant="primary"
            size="md"
            className="flex items-center gap-1.5 h-10 px-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Generate</span>
                <kbd className="hidden sm:inline-flex items-center justify-center font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/20 text-current ml-0.5 opacity-80">
                  ↵
                </kbd>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Composer Bottom Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-5 py-2.5 border-t border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.01]">
        {/* Example prompts as small secondary pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[12px] font-medium text-muted-foreground select-none mr-0.5">
            Try:
          </span>
          {examplePrompts.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="inline-flex items-center h-6 sm:h-7 px-2.5 sm:px-3 rounded-full text-[12px] font-medium bg-slate-200/50 hover:bg-slate-300/60 dark:bg-white/5 dark:hover:bg-white/10 text-foreground border border-border transition-all cursor-pointer truncate max-w-[220px] sm:max-w-none active:scale-98"
            >
              {example}
            </button>
          ))}
        </div>

        {/* Start from a template on the same row, right-aligned */}
        <Link
          href="/templates"
          className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors group select-none shrink-0"
        >
          <span>Start from a template</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
