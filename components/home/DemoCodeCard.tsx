"use client";

import { useState } from "react";
import { Check, Copy, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildHeroJsonLines,
  HERO_DEMO_RAW_JSON,
  type JsonToken,
} from "./heroDemoConfig";

const TOKEN_CLASSES: Record<JsonToken["kind"], string> = {
  key: "token-key font-medium",
  string: "token-string",
  punct: "token-punct",
  bracket: "token-bracket font-medium",
  bool: "token-bool font-medium",
  plain: "",
};

type DemoCodeCardProps = {
  metricDisplayValue?: string;
  typedLiveText?: string;
  showCursor?: boolean;
  isLineHighlighted?: boolean;
};

function renderTypedSuffix(text: string) {
  if (!text) return null;
  // Colorize ', "live": true' progressively using theme syntax tokens
  const segments: Array<{ kind: JsonToken["kind"]; text: string }> = [];
  const full = ', "live": true';
  const rules: Array<{ len: number; kind: JsonToken["kind"] }> = [
    { len: 2, kind: "punct" }, // ", "
    { len: 6, kind: "key" }, // '"live"'
    { len: 2, kind: "punct" }, // ": "
    { len: 4, kind: "bool" }, // "true"
  ];
  let cursor = 0;
  for (const r of rules) {
    if (cursor >= text.length) break;
    const end = Math.min(text.length, cursor + r.len);
    segments.push({ kind: r.kind, text: full.slice(cursor, end) });
    cursor = end;
  }
  return segments.map((seg, i) => (
    <span key={i} className={TOKEN_CLASSES[seg.kind]}>
      {seg.text}
    </span>
  ));
}

export function DemoCodeCard({
  metricDisplayValue = "1,244",
  typedLiveText = "",
  showCursor = false,
  isLineHighlighted = false,
}: DemoCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const lines = buildHeroJsonLines(metricDisplayValue);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(HERO_DEMO_RAW_JSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard permission errors in restricted contexts
    }
  };

  return (
    <div
      data-testid="hero-code-card"
      className="glass-1 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full min-h-[410px] transition-colors relative"
    >
      {/* Top Header Row — matching 44px (h-11) height with preview card */}
      <div className="h-11 flex items-center justify-between gap-2 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-2-nested text-[13px] font-medium text-foreground select-none h-8">
          <FileCode className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <span className="font-mono">app.config.json</span>
        </div>

        <Button
          type="button"
          onClick={handleCopy}
          variant="secondary"
          size="sm"
          className="gap-1.5 h-8 px-3 text-[13px]"
          aria-label="Copy JSON configuration"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success-text" strokeWidth={2} />
              <span className="text-success-text font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code Body — wraps cleanly with zero horizontal scroll */}
      <div
        data-testid="code-panel-body"
        className="py-2.5 font-mono text-[13px] leading-[19px] select-text flex-1 flex flex-col justify-center overflow-x-hidden"
      >
        <div className="w-full flex flex-col">
          {lines.map((tokens, lineIdx) => {
            const isTargetLine = lineIdx === 11; // "entity": "workflows"
            const isValueLine = lineIdx === 6 && isLineHighlighted;
            return (
              <div
                key={lineIdx}
                className={`flex items-baseline gap-4 min-w-0 rounded px-1.5 -mx-1.5 transition-colors duration-200 ${
                  (isTargetLine && isLineHighlighted) || isValueLine
                    ? "bg-brand-light"
                    : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-5 text-right text-text-muted/60 select-none shrink-0 tabular-nums"
                >
                  {lineIdx + 1}
                </span>
                <code className="whitespace-pre-wrap break-words min-w-0 flex-1">
                  {tokens.map((tok, tokIdx) => (
                    <span key={tokIdx} className={TOKEN_CLASSES[tok.kind]}>
                      {tok.text}
                    </span>
                  ))}
                  {isTargetLine && renderTypedSuffix(typedLiveText)}
                  {isTargetLine && showCursor && (
                    <span
                      aria-hidden="true"
                      className="inline-block w-[2px] h-[14px] bg-brand-link align-middle ml-0.5 animate-pulse"
                    />
                  )}
                </code>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiet Footer Caption — aligned to exact same baseline */}
      <div className="h-9 pt-2.5 border-t border-border text-[13px] text-muted-foreground flex items-center justify-between gap-2 shrink-0">
        <span className="truncate">Registry: Statistic, DataTable</span>
        <span className="font-mono whitespace-nowrap shrink-0">Zod-validated</span>
      </div>
    </div>
  );
}
