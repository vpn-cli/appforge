"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, type Transition } from "motion/react";
import { Sparkles, ArrowUp, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type CopilotFloatingPillProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (components: unknown[], appName?: string) => void;
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
  const pillButtonRef = useRef<HTMLButtonElement>(null);
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

  // Handle Esc key to collapse and return focus to pill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onOpenChange(false);
        setTimeout(() => {
          pillButtonRef.current?.focus();
        }, 50);
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

        // Validate entity identifier length and format in generated AST / schema
        // If an entity name is longer than 22 characters, show the user a clear message, not a database error
        const checkEntityLengths = (obj: unknown): string | null => {
          if (!obj || typeof obj !== "object") return null;
          const candidate = obj as Record<string, unknown>;
          if (candidate.entities && typeof candidate.entities === "object") {
            for (const entityKey of Object.keys(candidate.entities as Record<string, unknown>)) {
              if (entityKey.length > 22) {
                return `Entity name "${entityKey}" exceeds maximum length of 22 characters. Please use a shorter snake_case name (at most 22 characters).`;
              }
            }
          }
          if (typeof candidate.entity === "string" && candidate.entity.length > 22) {
            return `Entity name "${candidate.entity}" exceeds maximum length of 22 characters. Please use a shorter snake_case name (at most 22 characters).`;
          }
          for (const val of Object.values(candidate)) {
            if (typeof val === "object" && val !== null) {
              const err = checkEntityLengths(val);
              if (err) return err;
            }
          }
          return null;
        };

        const lengthError = checkEntityLengths(parsed);
        if (lengthError) {
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              content: `Naming Error: ${lengthError}`,
            },
          ]);
          return;
        }

        // Extract app name if top-level "app" is returned
        let extractedAppName: string | undefined = undefined;
        if (parsed && typeof parsed.app === "string" && parsed.app.trim()) {
          extractedAppName = parsed.app.trim();
        }

        if (parsed?.pages?.[0]?.components) {
          parsed = parsed.pages[0].components;
        } else if (parsed?.components && Array.isArray(parsed.components)) {
          parsed = parsed.components;
        }

        const finalArray = Array.isArray(parsed) ? parsed : [parsed];

        // If no top-level "app" field was provided, infer from first Header component
        if (!extractedAppName && Array.isArray(finalArray)) {
          const headerNode = finalArray.find((node: unknown) => {
            return (
              node &&
              typeof node === "object" &&
              (node as Record<string, unknown>).type === "Header" &&
              typeof (node as Record<string, unknown>).title === "string"
            );
          }) as { title?: string } | undefined;
          if (headerNode?.title && headerNode.title.trim()) {
            extractedAppName = headerNode.title.trim();
          }
        }

        // Sanitize any outdated 2023 dates in mock data to recent dates relative to today
        const currentYear = new Date().getFullYear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitizeDates = (obj: any): any => {
          if (!obj) return obj;
          if (typeof obj === "string") {
            return obj
              .replace(/202[0-3](-[0-1][0-9]-[0-3][0-9])/g, `${currentYear}$1`)
              .replace(/202[0-3]/g, String(currentYear));
          }
          if (Array.isArray(obj)) {
            return obj.map(sanitizeDates);
          }
          if (typeof obj === "object") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newObj: Record<string, any> = {};
            for (const k of Object.keys(obj)) {
              newObj[k] = sanitizeDates(obj[k]);
            }
            return newObj;
          }
          return obj;
        };

        const sanitizedComponents = sanitizeDates(finalArray);
        onApply(sanitizedComponents, extractedAppName);
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

  // Open spring: visualDuration 0.38, bounce 0.2. Close: duration 0.22, ease [0.4, 0, 0.2, 1].
  // Reduced motion: opacity-only fade of 0.12s.
  const openTransition: Transition = shouldReduceMotion
    ? { duration: 0.12, ease: "easeOut" }
    : {
        type: "spring",
        visualDuration: 0.38,
        bounce: 0.2,
      };

  const closeTransition: Transition = shouldReduceMotion
    ? { duration: 0.12, ease: "easeOut" }
    : {
        duration: 0.22,
        ease: [0.4, 0, 0.2, 1],
      };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-4 right-4 z-40 pointer-events-auto select-none"
    >
      <AnimatePresence initial={false}>
        {!isOpen ? (
          /* =====================================================================
             COLLAPSED STATE: Compact glass pill morphing with shared layoutId
             ===================================================================== */
          <motion.button
            key="collapsed-pill"
            ref={pillButtonRef}
            layoutId={shouldReduceMotion ? undefined : "copilot-container"}
            type="button"
            onClick={() => {
              onOpenChange(true);
              setTimeout(() => internalInputRef.current?.focus(), 150);
            }}
            initial={shouldReduceMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : undefined}
            transition={closeTransition}
            style={{
              width: 220,
              height: 40,
              borderRadius: 20,
              originX: 1,
              originY: 1,
              transformOrigin: "100% 100%",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
            }}
            className="absolute bottom-0 right-0 border border-border/80 dark:border-white/15 glass-1 cursor-pointer group flex items-center justify-between overflow-hidden outline-none"
            aria-label="Open Copilot chat"
            aria-expanded={isOpen}
          >
            <AnimatePresence>
              {!isOpen && (
                <motion.div
                  key="pill-label"
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.08, ease: "easeOut" },
                  }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="flex items-center justify-between gap-2 w-full px-3.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-brand-link shrink-0" />
                    <span className="text-[13px] font-medium text-foreground truncate">
                      Ask Copilot
                    </span>
                  </div>
                  <Kbd className="text-[11px] px-1.5 py-0.5 bg-black/5 dark:bg-white/10 text-muted-foreground border-transparent">
                    ⌘K
                  </Kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ) : (
          /* =====================================================================
             EXPANDED STATE: Morphs from bottom-right corner via shared layoutId.
             Surface at least 92% opaque (smoked glass).
             Inner content fades and rises with crossfade (0.14s delay over 0.16s).
             ===================================================================== */
          <motion.div
            key="expanded-panel"
            layoutId={shouldReduceMotion ? undefined : "copilot-container"}
            initial={shouldReduceMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : undefined}
            transition={openTransition}
            style={{
              width: "min(520px, calc(100% - 32px))",
              height: "min(560px, calc(100% - 32px))",
              borderRadius: 16,
              originX: 1,
              originY: 1,
              transformOrigin: "100% 100%",
              boxShadow: "0 24px 70px -20px rgba(0, 0, 0, 0.45)",
            }}
            className="absolute bottom-0 right-0 border border-border/80 dark:border-white/15 glass-1 flex flex-col overflow-hidden"
          >
            {/* Morphing content: children never scale or stretch, crossfaded with AnimatePresence */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  key="panel-content"
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.08, ease: "easeOut" },
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.12, ease: "easeOut" }
                      : { delay: 0.14, duration: 0.16, ease: "easeOut" }
                  }
                  className="w-full h-full flex flex-col min-h-0 overflow-hidden absolute inset-0"
                >
                  {/* Header: Title + Esc/Collapse buttons */}
                  <div className="h-11 px-4 border-b border-border/40 dark:border-white/8 flex items-center justify-between shrink-0 bg-transparent">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-500/15 dark:bg-brand-400/20 text-brand-link flex items-center justify-center">
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
                        onClick={() => {
                          onOpenChange(false);
                          setTimeout(() => pillButtonRef.current?.focus(), 50);
                        }}
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
                              ? "bg-foreground text-background font-medium shadow-xs"
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
                          <Loader2 className="w-4 h-4 animate-spin text-brand-link" />
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
                    <div className="text-brand-link shrink-0">
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

                    {/* Circular send button: visibly enabled (accent) whenever input has text; muted only when empty */}
                    <button
                      type="submit"
                      disabled={isGenerating || !hasText}
                      aria-label="Send prompt"
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 outline-none shrink-0",
                        hasText && !isGenerating
                          ? "bg-brand-600 hover:bg-brand-500 text-white shadow-[0_2px_8px_rgba(109,91,240,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
                          : "bg-black/5 dark:bg-white/5 text-muted-foreground/30 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.25]" />
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
