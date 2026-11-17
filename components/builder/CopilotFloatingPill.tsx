"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowUp, Loader2, ChevronDown } from "lucide-react";
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
      const target = e.target as HTMLElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target?.closest?.("[data-copilot-toggle]")
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

  // Spring animation transition: ~220ms, snappy and elegant
  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 30, mass: 0.8 };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-4 right-4 z-40 pointer-events-auto select-none"
      style={{
        width: isOpen ? "min(520px, calc(100% - 32px))" : "220px",
        height: isOpen ? "min(560px, calc(100% - 32px))" : "40px",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isOpen ? (
          /* =====================================================================
             COLLAPSED STATE: Compact glass pill (sparkle + "Ask Copilot" + ⌘K), ~220px
             ===================================================================== */
          <motion.button
            key="collapsed-pill"
            type="button"
            onClick={() => {
              onOpenChange(true);
              setTimeout(() => internalInputRef.current?.focus(), 80);
            }}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
            transition={springTransition}
            className="w-full h-10 px-3.5 rounded-full flex items-center justify-between gap-2 border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#121218]/95 backdrop-blur-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            aria-label="Open Copilot chat"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 group-hover:rotate-12 transition-transform" />
              <span className="text-[13px] font-medium text-foreground truncate">
                Ask Copilot
              </span>
            </div>
            <Kbd className="text-[11px] px-1.5 py-0.5 bg-black/5 dark:bg-white/10 text-muted-foreground border-transparent">
              ⌘K
            </Kbd>
          </motion.button>
        ) : (
          /* =====================================================================
             EXPANDED STATE: Grows up and to the left from bottom-right corner.
             Surface at least 92% opaque (smoked glass).
             Stays inside the editor pane bounds.
             ===================================================================== */
          <motion.div
            key="expanded-panel"
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, scale: 0.95, originX: 1, originY: 1 }
            }
            animate={{ opacity: 1, scale: 1, originX: 1, originY: 1 }}
            exit={
              shouldReduceMotion
                ? undefined
                : { opacity: 0, scale: 0.95, originX: 1, originY: 1 }
            }
            transition={springTransition}
            className="w-full h-full rounded-[22px] border border-black/10 dark:border-white/15 bg-white/96 dark:bg-[#121218]/96 backdrop-blur-2xl shadow-[0_24px_70px_-20px_rgba(0,0,0,0.45)] dark:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
          >
            {/* Header: Title + Esc/Collapse buttons */}
            <div className="h-11 px-4 border-b border-border/40 dark:border-white/8 flex items-center justify-between shrink-0 bg-transparent">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/15 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">
                  AppForge Copilot
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  · AI UI Generator
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Kbd className="text-[11px]">Esc</Kbd>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  aria-label="Collapse Copilot"
                  className="w-7 h-7 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-4 h-4" />
                </IconButton>
              </div>
            </div>

            {/* Message History */}
            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-[13px] leading-relaxed select-text"
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
                      "p-3 max-w-[85%] rounded-2xl text-[13px]",
                      m.role === "user"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-[#0B0B10] font-medium shadow-xs"
                        : "bg-black/5 dark:bg-white/5 text-foreground border border-black/5 dark:border-white/5"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex w-full justify-start">
                  <div className="bg-black/5 dark:bg-white/5 text-foreground rounded-2xl p-3 inline-flex items-center gap-2 text-[13px]">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Synthesizing components from prompt...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Docked at Bottom */}
            <form
              onSubmit={handleGenerate}
              className="h-[52px] px-3.5 border-t border-border/40 dark:border-white/8 flex items-center gap-2.5 shrink-0 bg-black/[0.02] dark:bg-white/[0.02]"
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
                placeholder="Ask Copilot to generate or modify components…"
                disabled={isGenerating}
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
              />

              {/* Circular send button */}
              <Button
                type="submit"
                disabled={isGenerating || !hasText}
                variant="primary"
                size="icon"
                className="w-7 h-7 rounded-full shrink-0"
                aria-label="Send prompt"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5" />
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
