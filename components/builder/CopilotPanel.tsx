"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, ArrowUp } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (components: unknown[]) => void;
  onStreamStart?: () => void;
  onStream?: (text: string) => void;
  onStreamEnd?: () => void;
  initialPrompt?: string;
  width: number;
  onWidthChange: (w: number) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
};

const suggestedPrompts = [
  "Add a priority column to the table",
  "Add a metrics card for weekly active users",
  "Create a status badge with alert colors",
];

export function CopilotPanel({
  isOpen,
  onClose,
  onApply,
  onStreamStart,
  onStream,
  onStreamEnd,
  initialPrompt,
  width,
  onWidthChange,
  inputRef: externalInputRef,
}: Props) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([]);

  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const activeInputRef = externalInputRef || internalInputRef;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(width);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Handle resizing via left edge drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Dragging left increases width, dragging right decreases width
      const delta = dragStartXRef.current - e.clientX;
      const nextWidth = Math.min(560, Math.max(320, startWidthRef.current + delta));
      onWidthChange(nextWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onWidthChange]);

  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const targetPrompt = (customPrompt ?? prompt).trim();
    if (!targetPrompt || isGenerating) return;

    setMessages((prev) => [...prev, { role: "user", content: targetPrompt }]);
    setPrompt("");

    setIsGenerating(true);
    let streamedText = "";

    try {
      if (onStreamStart) onStreamStart();
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: targetPrompt }),
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

        if (onStream) {
          onStream(streamedText);
        }
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
            content: "Synthesized the requested changes into your config.",
          },
        ]);
      }
    } catch (err) {
      const e = err as Error;
      if (
        e.message &&
        (e.message.includes("exhausted") || e.message.includes("429"))
      ) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "AI rate limit reached. Please check back shortly or update API keys in .env.local.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `Error: ${e.message}` },
        ]);
      }
    } finally {
      setIsGenerating(false);
      if (onStreamEnd) onStreamEnd();
    }
  };

  if (!isOpen) return null;

  const hasText = prompt.trim().length > 0;

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative shrink-0 h-full bg-card border-l border-border flex flex-col overflow-hidden select-none z-10"
      aria-label="Copilot AI Panel"
    >
      {/* Left Resize Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute left-0 top-0 bottom-0 w-1.5 -ml-0.5 cursor-col-resize hover:bg-brand/50 transition-colors z-20 ${
          isDragging ? "bg-brand w-2" : ""
        }`}
        title="Drag to resize panel (320px - 560px)"
      />

      {/* Header: "Copilot" in sentence case with "Gemini" as small muted text, no sparkle/robot/star icons */}
      <div className="h-9 px-3.5 border-b border-border bg-card flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground">Copilot</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            Gemini
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          aria-label="Close Copilot"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages / Empty State Feed */}
      <div
        data-lenis-prevent
        className="flex-1 bg-background/50 overflow-y-auto p-4 text-xs font-medium flex flex-col space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-muted-foreground font-medium">
              Describe a change to this app.
            </p>
            <div className="flex flex-col gap-2">
              {suggestedPrompts.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(example);
                    activeInputRef.current?.focus();
                  }}
                  className="text-left text-xs p-2.5 rounded-md bg-muted/40 hover:bg-muted text-foreground border border-border/50 hover:border-border transition-colors leading-relaxed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex w-full ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 max-w-[85%] text-xs leading-relaxed rounded-lg border ${
                  m.role === "user"
                    ? "bg-brand text-text-inverse border-brand shadow-xs"
                    : "bg-card border-border text-foreground shadow-xs"
                }`}
              >
                <span className="leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </span>
              </div>
            </div>
          ))
        )}

        {isGenerating && (
          <div className="flex w-full justify-start">
            <div className="bg-card border border-border text-foreground rounded-lg p-3 inline-flex items-center gap-2 text-xs shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
              <span>Generating changes...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => handleGenerate(e)}
        className="p-3 border-t border-border bg-card flex items-end gap-2 shrink-0"
      >
        <textarea
          ref={activeInputRef}
          data-lenis-prevent
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleGenerate();
            }
          }}
          placeholder="Describe a change to this app..."
          className="flex-1 bg-muted/50 border border-border focus:border-brand rounded-md min-h-[40px] max-h-[120px] py-2 px-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
          disabled={isGenerating}
          rows={2}
        />
        <Button
          type="submit"
          disabled={isGenerating || !hasText}
          size="sm"
          className={`h-[40px] w-[40px] p-0 rounded-md shrink-0 transition-colors flex items-center justify-center ${
            hasText
              ? "bg-brand hover:bg-brand-dark text-text-inverse shadow-xs cursor-pointer"
              : "bg-muted text-muted-foreground/60 border border-border/50 cursor-not-allowed opacity-60"
          }`}
          aria-label="Send prompt to Copilot"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </Button>
      </form>
    </aside>
  );
}
