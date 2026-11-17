"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowUp, Loader2, X, ChevronDown, Bot, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type CopilotFloatingPillProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (components: unknown[]) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  initialPrompt?: string;
  externalInputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
};

export function CopilotFloatingPill({
  isOpen,
  onOpenChange,
  onApply,
  onStreamStart,
  onStreamEnd,
  initialPrompt,
  externalInputRef,
}: CopilotFloatingPillProps) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const [messages, setMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([
    {
      role: "ai",
      content:
        "Describe your data requirements or UI updates. I'll generate structured JSON matching the component registry.",
    },
  ]);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      onOpenChange(true);
    }
  }, [initialPrompt, onOpenChange]);

  // Handle outside clicks to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  // Handle Esc key to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpenChange]);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isGenerating]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const currentPrompt = prompt;
    setMessages((prev) => [...prev, { role: "user", content: currentPrompt }]);
    setPrompt("");
    if (!isOpen) onOpenChange(true);

    setIsGenerating(true);
    let streamedText = "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      if (onStreamStart) onStreamStart();
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream.");

      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;
      }

      let finalText = streamedText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const firstBrace = finalText.indexOf("{");
      const firstBracket = finalText.indexOf("[");
      const isArrayFirst =
        firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);

      const first = isArrayFirst ? firstBracket : firstBrace;
      const last = isArrayFirst
        ? finalText.lastIndexOf("]")
        : finalText.lastIndexOf("}");

      if (first !== -1 && last !== -1 && last > first) {
        finalText = finalText.substring(first, last + 1);
      }

      if (finalText) {
        let parsed = JSON.parse(finalText);

        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }

        if (parsed?.pages?.[0]?.components) {
          parsed = parsed.pages[0].components;
        } else if (parsed?.components && Array.isArray(parsed.components)) {
          parsed = parsed.components;
        }

        const finalArray = Array.isArray(parsed) ? parsed : [parsed];
        onApply(finalArray);
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Components compiled and applied to your config.",
          },
        ]);
      }
    } catch (err) {
      const e = err as Error;
      if (e.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "Request timed out after 25s. The model was slow to respond; please try again.",
          },
        ]);
      } else if (
        e.message &&
        (e.message.includes("exhausted") || e.message.includes("429"))
      ) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "AI rate limit reached. Please check API keys or retry in a few moments.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `Error: ${e.message}` },
        ]);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
      if (onStreamEnd) onStreamEnd();
    }
  };

  const hasText = prompt.trim().length > 0;

  // Spring animation transition: ~250ms, springy but subtle
  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 360, damping: 28, mass: 0.8 };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-[560px] pointer-events-auto select-none"
    >
      <motion.div
        layout
        transition={springTransition}
        className={cn(
          "w-full glass-1 border border-white/80 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-colors",
          isOpen ? "h-[520px] max-h-[80vh] rounded-[24px]" : "h-[52px] rounded-full"
        )}
      >
        {/* Expanded Content: Header + Messages */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={springTransition}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {/* Header */}
              <div className="h-12 px-4 border-b border-border/40 dark:border-white/8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/15 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[14px] font-semibold text-foreground">
                    AppForge Copilot
                  </span>
                  <span className="text-[12px] text-muted-foreground hidden sm:inline">
                    · AI UI Generator
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Kbd>Esc</Kbd>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    aria-label="Collapse Copilot"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>

              {/* Message History */}
              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-[13px] leading-relaxed"
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex w-full",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 max-w-[85%] rounded-2xl",
                        m.role === "user"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-[#0B0B10] font-medium shadow-xs"
                          : "glass-2-nested text-foreground border border-black/5 dark:border-white/5"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex w-full justify-start">
                    <div className="glass-2-nested text-foreground rounded-2xl p-3 inline-flex items-center gap-2 text-[13px]">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Synthesizing components from prompt...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Docked at Bottom (Always Visible, 52px) */}
        <form
          onSubmit={handleGenerate}
          className="h-[52px] px-3.5 flex items-center gap-2.5 shrink-0 bg-transparent border-t border-transparent"
        >
          <div className="text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <input
            ref={(node) => {
              internalInputRef.current = node;
              if (externalInputRef && "current" in externalInputRef) {
                (externalInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => {
              if (!isOpen) onOpenChange(true);
            }}
            placeholder="Ask Copilot to generate or modify components…"
            disabled={isGenerating}
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
          />

          {!isOpen && (
            <div className="hidden sm:flex items-center shrink-0">
              <Kbd>⌘K</Kbd>
            </div>
          )}

          {/* Circular send button */}
          <Button
            type="submit"
            disabled={isGenerating || !hasText}
            variant="primary"
            size="icon"
            className="w-8 h-8 rounded-full shrink-0"
            aria-label="Send prompt"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
