"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUp, Bot, PanelLeftClose } from "lucide-react";

type CopilotPanelProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onApply: (components: unknown[]) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  initialPrompt?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export function CopilotPanel({
  isCollapsed,
  onToggleCollapse,
  width,
  onApply,
  onStreamStart,
  onStreamEnd,
  initialPrompt,
  inputRef,
}: CopilotPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const [messages, setMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([
    {
      role: "ai",
      content:
        "Describe your data requirements or UI updates. I'll generate structured JSON matching the component registry.",
    },
  ]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const currentPrompt = prompt;
    setMessages((prev) => [...prev, { role: "user", content: currentPrompt }]);
    setPrompt("");

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
            content: "Request timed out after 25s. The model was slow to respond; please try again.",
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

  // Collapsed state renders slim rail (icon + label)
  if (isCollapsed) {
    return (
      <aside
        style={{ width: "38px" }}
        className="h-full border-r border-border bg-card flex flex-col items-center py-2.5 shrink-0 cursor-pointer hover:bg-muted/40 transition-colors group select-none"
        onClick={onToggleCollapse}
        title="Expand Copilot (⌘K)"
        role="region"
        aria-label="Copilot rail"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="p-1 rounded-md text-muted-foreground group-hover:text-foreground hover:bg-muted transition-colors mb-3"
          aria-label="Expand Copilot panel"
        >
          <Bot className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-medium text-muted-foreground group-hover:text-foreground tracking-wider select-none">
            Copilot
          </span>
        </div>
        <kbd className="text-[9px] font-mono text-muted-foreground/70 bg-muted/50 border border-border/80 px-1 py-0.5 rounded mt-auto">
          ⌘K
        </kbd>
      </aside>
    );
  }

  const hasText = prompt.trim().length > 0;

  return (
    <aside
      style={{ width: `${width}px` }}
      aria-label="Copilot Assistant"
      className="h-full border-r border-border bg-card flex flex-col shrink-0 relative select-none min-w-[300px]"
      role="region"
    >
      {/* Panel Header: 36px (h-9) */}
      <div className="h-9 px-3 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Copilot</span>
          <span className="text-[10px] font-mono text-muted-foreground border border-border px-1 py-0.2 rounded">
            ⌘K
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          aria-label="Collapse Copilot to slim rail"
          title="Collapse to slim rail"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div
        data-lenis-prevent
        className="flex-1 bg-card overflow-y-auto p-3 text-xs font-normal flex flex-col space-y-3"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2.5 max-w-[90%] text-xs leading-relaxed rounded-lg border ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground border-primary font-medium"
                  : "bg-muted/40 border-border text-foreground"
              }`}
            >
              <span className="leading-relaxed whitespace-pre-wrap">
                {m.content}
              </span>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex w-full justify-start">
            <div className="bg-muted/40 border border-border text-foreground rounded-lg p-2.5 inline-flex items-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span>Synthesizing components...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box: Solid primary with AA contrast when text, neutral gray when disabled */}
      <form
        onSubmit={handleGenerate}
        className="p-2.5 border-t border-border bg-card flex items-end gap-2 shrink-0"
      >
        <textarea
          ref={inputRef}
          data-lenis-prevent
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleGenerate(e);
            }
          }}
          placeholder="Ask Copilot to generate or modify components..."
          className="flex-1 bg-muted/40 border border-border rounded-lg min-h-[38px] max-h-[100px] py-2 px-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors leading-relaxed"
          disabled={isGenerating}
          rows={2}
        />

        <Button
          type="submit"
          disabled={isGenerating || !hasText}
          size="sm"
          className={`h-[38px] w-[38px] p-0 rounded-lg shrink-0 transition-colors flex items-center justify-center ${
            hasText && !isGenerating
              ? "bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground font-medium"
              : "bg-muted text-muted-foreground border-transparent cursor-not-allowed"
          }`}
          aria-label="Send prompt to Copilot"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </Button>
      </form>
    </aside>
  );
}
