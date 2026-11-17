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

export function PromptBox({ onPlainCreate, isPending, appCount = 0 }: Props) {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
  const showExamples = isFocused || appCount < 3;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Hero Glass Input: 56px tall, radius 20, glass-1 material */}
      <form
        onSubmit={handleGenerate}
        className="w-full h-14 px-4 sm:px-5 rounded-[20px] glass-1 flex items-center gap-3 shadow-lg transition-all"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay slightly to allow click on example chips
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder="Describe the app you want to build..."
          disabled={isSubmitting || isPending}
          className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none h-full"
        />

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="submit"
            disabled={!hasText || isSubmitting || isPending}
            variant="primary"
            size="md"
            className="flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Generate</span>
                <kbd className="hidden sm:inline-block font-mono text-[12px] opacity-70">
                  ↵
                </kbd>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Example Prompts as secondary sm pills */}
      {showExamples && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[13px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-[13px] mr-1 select-none">
              Examples:
            </span>
            {examplePrompts.map((example, idx) => (
              <Button
                key={idx}
                type="button"
                variant="secondary"
                size="sm"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleExampleClick(example);
                }}
                className="text-left truncate max-w-[280px] sm:max-w-none"
              >
                {example}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <Link
              href="/templates"
              className="text-muted-foreground hover:text-foreground text-[13px] font-medium flex items-center gap-1 hover:underline underline-offset-4 transition-colors"
            >
              <span>Start from a template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
