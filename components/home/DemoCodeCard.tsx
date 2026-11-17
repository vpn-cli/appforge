"use client";

import { useState } from "react";
import { FileCode, ChevronDown, Copy, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useHeroScriptedEdit } from "./HeroScriptedEditContext";

const CODE_RAW_BASE = `{
  "app": "ops_dashboard",
  "pages": [{
    "components": [
      { "type": "Metric", "title": "Active Workflows" },
      { "type": "DataTable", "entity": "workflows" }
    ]
  }]
}`;

const keyStyle = "text-[#2B6CB0] dark:text-[#8FA8FF] font-medium";
const strStyle = "text-[#8A7A1F] dark:text-[#D9C27A]";
const punctStyle = "text-slate-600 dark:text-slate-400";
const bracketStyle = "text-violet-700 dark:text-violet-300 font-medium";
const boolStyle = "text-emerald-600 dark:text-emerald-400 font-medium";

function renderTypedTokens(text: string) {
  if (!text) return null;

  // Expected full string: ', "live": true'
  const comma = text.slice(0, 2); // ', '
  const key = text.slice(2, 8); // '"live"'
  const colon = text.slice(8, 10); // ': '
  const val = text.slice(10); // 'true'

  return (
    <>
      {comma && <span className={punctStyle}>{comma}</span>}
      {key && <span className={keyStyle}>{key}</span>}
      {colon && <span className={punctStyle}>{colon}</span>}
      {val && <span className={boolStyle}>{val}</span>}
    </>
  );
}

export function DemoCodeCard() {
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { typedText, showCursor, isLineHighlighted } = useHeroScriptedEdit();

  // Pointer tracking for subtle 8% specular glass highlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isCardHovered, setIsCardHovered] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleCopy = async () => {
    try {
      const codeToCopy = typedText
        ? CODE_RAW_BASE.replace('"workflows" }', `"workflows"${typedText} }`)
        : CODE_RAW_BASE;
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsCardHovered(true)}
      onPointerLeave={() => setIsCardHovered(false)}
      className="glass-1 rounded-[24px] p-5 flex flex-col justify-between h-[370px] max-h-[380px] transition-all overflow-hidden relative"
    >
      {/* Specular highlight on glass panels follows cursor (radial gradient, 8% opacity) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px] transition-opacity duration-300 z-20"
        style={{
          opacity: isCardHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.08), transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/60 dark:border-white/10 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]/90 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]/90 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#10B981]/90 shadow-xs" />
          </div>

          {/* File tab: app.config.json with a chevron */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg glass-2-nested text-[14px] font-medium text-slate-800 dark:text-slate-200 select-none ml-1">
            <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
            <span>app.config.json</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" strokeWidth={2} />
          </div>
        </div>

        {/* Copy button */}
        <Button
          type="button"
          onClick={handleCopy}
          variant="secondary"
          size="sm"
          className="gap-1.5 h-8 px-2.5 text-[13px]"
          aria-label="Copy JSON code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code Editor Body: Compact 9-line version, line-height 25px */}
      <div className="my-2.5 font-mono text-[14px] leading-[25px] select-text flex gap-3.5 flex-1 overflow-x-auto items-start pt-0.5 relative z-10">
        {/* Line numbers at 35% opacity */}
        <div
          className="flex flex-col text-right text-slate-900/35 dark:text-slate-100/35 select-none font-mono pr-3 border-r border-slate-300/40 dark:border-white/10 shrink-0 font-normal"
          aria-hidden="true"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <span key={num} className="leading-[25px]">
              {num}
            </span>
          ))}
        </div>

        {/* Code lines */}
        <div className="font-mono leading-[25px] whitespace-pre flex-1">
          {/* Line 1 */}
          <div className={bracketStyle}>{"{"}</div>

          {/* Line 2 */}
          <div>
            <span className={keyStyle}>{'  "app"'}</span>
            <span className={punctStyle}>{": "}</span>
            <span className={strStyle}>{'"ops_dashboard"'}</span>
            <span className={punctStyle}>{","}</span>
          </div>

          {/* Line 3 */}
          <div>
            <span className={keyStyle}>{'  "pages"'}</span>
            <span className={punctStyle}>{": "}</span>
            <span className={bracketStyle}>{"[{"}</span>
          </div>

          {/* Line 4 */}
          <div>
            <span className={keyStyle}>{'    "components"'}</span>
            <span className={punctStyle}>{": "}</span>
            <span className={bracketStyle}>{"["}</span>
          </div>

          {/* Line 5 */}
          <div>
            <span className={bracketStyle}>{"      { "}</span>
            <span className={keyStyle}>{'"type"'}</span>
            <span className={punctStyle}>{": "}</span>
            <span className={strStyle}>{'"Metric"'}</span>
            <span className={punctStyle}>{", "}</span>
            <span className={keyStyle}>{'"title"'}</span>
            <span className={punctStyle}>{": "}</span>
            <span className={strStyle}>{'"Active Workflows"'}</span>
            <span className={bracketStyle}>{" },"}</span>
          </div>

          {/* Line 6: Scripted live edit target with soft highlight */}
          <div
            className={`transition-colors duration-300 rounded-md px-1 -mx-1 inline-flex items-center ${
              isLineHighlighted
                ? "bg-indigo-500/12 dark:bg-indigo-400/18 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.22)]"
                : "bg-transparent"
            }`}
          >
            <span className={bracketStyle}>{"      { "}</span>
            <span className={keyStyle}>{'"type"'}</span>
            <span className={punctStyle}>{": "}</span>
            <span className={strStyle}>{'"DataTable"'}</span>
            <span className={punctStyle}>{", "}</span>
            <span className={keyStyle}>{'"entity"'}</span>
            <span className={punctStyle}>{": "}</span>
            <span className={strStyle}>{'"workflows"'}</span>
            {renderTypedTokens(typedText)}
            {showCursor && (
              <span
                className="inline-block w-1.5 h-3.5 ml-0.5 bg-indigo-600 dark:bg-indigo-400 animate-pulse align-middle"
                aria-hidden="true"
              />
            )}
            <span className={bracketStyle}>{" }"}</span>
          </div>

          {/* Line 7 */}
          <div className={bracketStyle}>{"    ]"}</div>

          {/* Line 8 */}
          <div className={bracketStyle}>{"  }]"}</div>

          {/* Line 9 */}
          <div className={bracketStyle}>{"}"}</div>
        </div>
      </div>
    </div>
  );
}
