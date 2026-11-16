"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Send, Sparkles } from "lucide-react";

export function CopilotPanel({
  isOpen,
  onClose,
  onApply,
  onStreamStart,
  onStream,
  onStreamEnd,
  initialPrompt,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (components: unknown[]) => void;
  onStreamStart?: () => void;
  onStream?: (text: string) => void;
  onStreamEnd?: () => void;
  initialPrompt?: string;
}) {
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
        "I am ready to build! Describe what components, metrics, or tables you'd like to generate.",
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

    try {
      if (onStreamStart) onStreamStart();
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt }),
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
            content: "I've synthesized the new components into your config!",
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
              "Gemini API quota exhausted. Please check back shortly or update API keys.",
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

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[420px] bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-11 px-4 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Gemini Copilot
          </span>
          <span className="text-[10px] font-mono text-muted-foreground border border-border px-1 py-0.5 rounded">
            ⌘K
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-muted"
          aria-label="Close Copilot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div
        data-lenis-prevent
        className="flex-1 bg-background/50 overflow-y-auto p-4 text-xs font-medium flex flex-col space-y-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
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
        ))}
        {isGenerating && (
          <div className="flex w-full justify-start">
            <div className="bg-card border border-border text-foreground rounded-lg p-3 inline-flex items-center gap-2.5 text-xs shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>Generating JSON schema...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleGenerate}
        className="p-3 border-t border-border bg-card flex items-end gap-2 shrink-0"
      >
        <textarea
          data-lenis-prevent
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleGenerate(e);
            }
          }}
          placeholder="e.g. Add 3 KPI cards for fleet telemetry and an active incidents table..."
          className="flex-1 bg-muted/60 border border-border rounded-lg min-h-[42px] max-h-[120px] py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          disabled={isGenerating}
          rows={2}
        />
        <Button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          size="sm"
          className="h-[42px] px-3.5 rounded-lg bg-brand hover:bg-brand-dark text-text-inverse shrink-0 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
