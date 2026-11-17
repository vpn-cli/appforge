"use client";

import { useState } from "react";
import { FileCode, ChevronDown, Copy, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

const CODE_RAW = `{
  "app": "ops_dashboard",
  "pages": [{
    "components": [
      { "type": "Metric", "title": "Active Workflows" },
      { "type": "DataTable", "entity": "workflows" }
    ]
  }]
}`;

interface LinePart {
  text: string;
  className: string;
}

interface CodeLine {
  num: number;
  parts: LinePart[];
}

const keyStyle = "text-[#2B6CB0] dark:text-[#8FA8FF] font-medium";
const strStyle = "text-[#8A7A1F] dark:text-[#D9C27A]";
const punctStyle = "text-slate-600 dark:text-slate-400";
const bracketStyle = "text-violet-700 dark:text-violet-300 font-medium";

const CODE_LINES: CodeLine[] = [
  {
    num: 1,
    parts: [{ text: "{", className: bracketStyle }],
  },
  {
    num: 2,
    parts: [
      { text: '  "app"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"ops_dashboard"', className: strStyle },
      { text: ",", className: punctStyle },
    ],
  },
  {
    num: 3,
    parts: [
      { text: '  "pages"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: "[{", className: bracketStyle },
    ],
  },
  {
    num: 4,
    parts: [
      { text: '    "components"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: "[", className: bracketStyle },
    ],
  },
  {
    num: 5,
    parts: [
      { text: "      { ", className: bracketStyle },
      { text: '"type"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"Metric"', className: strStyle },
      { text: ", ", className: punctStyle },
      { text: '"title"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"Active Workflows"', className: strStyle },
      { text: " },", className: bracketStyle },
    ],
  },
  {
    num: 6,
    parts: [
      { text: "      { ", className: bracketStyle },
      { text: '"type"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"DataTable"', className: strStyle },
      { text: ", ", className: punctStyle },
      { text: '"entity"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"workflows"', className: strStyle },
      { text: " }", className: bracketStyle },
    ],
  },
  {
    num: 7,
    parts: [{ text: "    ]", className: bracketStyle }],
  },
  {
    num: 8,
    parts: [{ text: "  }]", className: bracketStyle }],
  },
  {
    num: 9,
    parts: [{ text: "}", className: bracketStyle }],
  },
];

export function DemoCodeCard() {
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CODE_RAW);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="glass-1 rounded-[24px] p-5 flex flex-col justify-between h-[370px] max-h-[380px] transition-all overflow-hidden relative">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/60 dark:border-white/10 shrink-0">
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

      {/* Code Editor Body: Compact 9-line version, line-height 1.65 */}
      <div className="my-2.5 font-mono text-[14px] leading-[25px] select-text flex gap-3.5 flex-1 overflow-x-auto items-start pt-0.5">
        {/* Line numbers at 35% opacity */}
        <div
          className="flex flex-col text-right text-slate-900/35 dark:text-slate-100/35 select-none font-mono pr-3 border-r border-slate-300/40 dark:border-white/10 shrink-0 font-normal"
          aria-hidden="true"
        >
          {CODE_LINES.map((line) => (
            <span key={line.num} className="leading-[25px]">
              {line.num}
            </span>
          ))}
        </div>

        {/* Code lines */}
        <div className="font-mono leading-[25px] whitespace-pre flex-1">
          {CODE_LINES.map((line, idx) => (
            <motion.div
              key={line.num}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.15,
                delay: shouldReduceMotion ? 0 : idx * 0.02,
                ease: "easeOut",
              }}
            >
              {line.parts.map((part, pIdx) => (
                <span key={pIdx} className={part.className}>
                  {part.text}
                </span>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
