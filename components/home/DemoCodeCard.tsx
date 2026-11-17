"use client";

import { useState } from "react";
import { FileCode, ChevronDown, Copy, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

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
      { text: "[", className: bracketStyle },
      { text: "{", className: bracketStyle },
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
      { text: "      ", className: punctStyle },
      { text: "{", className: bracketStyle },
      { text: " ", className: punctStyle },
      { text: '"type"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"Metric"', className: strStyle },
      { text: ", ", className: punctStyle },
      { text: '"title"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"Active Workflows"', className: strStyle },
      { text: " ", className: punctStyle },
      { text: "}", className: bracketStyle },
      { text: ",", className: punctStyle },
    ],
  },
  {
    num: 6,
    parts: [
      { text: "      ", className: punctStyle },
      { text: "{", className: bracketStyle },
      { text: " ", className: punctStyle },
      { text: '"type"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"DataTable"', className: strStyle },
      { text: ", ", className: punctStyle },
      { text: '"entity"', className: keyStyle },
      { text: ": ", className: punctStyle },
      { text: '"workflows"', className: strStyle },
      { text: " ", className: punctStyle },
      { text: "}", className: bracketStyle },
    ],
  },
  {
    num: 7,
    parts: [
      { text: "    ", className: punctStyle },
      { text: "]", className: bracketStyle },
    ],
  },
  {
    num: 8,
    parts: [
      { text: "  ", className: punctStyle },
      { text: "}", className: bracketStyle },
      { text: "]", className: bracketStyle },
    ],
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
    <div className="glass-1 rounded-[24px] p-5 sm:p-6 flex flex-col justify-between h-full transition-all">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-white/60 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]/90 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]/90 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#10B981]/90 shadow-xs" />
          </div>

          {/* File tab: app.config.json with a chevron, 16px text */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-2-nested text-[16px] font-medium text-slate-800 dark:text-slate-200 select-none ml-1">
            <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
            <span>app.config.json</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" strokeWidth={2} />
          </div>
        </div>

        {/* Copy button (shows "Copied" for 1.5s) */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-2-nested text-slate-700 dark:text-slate-300 hover:opacity-90 transition-all cursor-pointer outline-none active:scale-95"
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
        </button>
      </div>

      {/* Code Editor Body: Single frosted surface, light syntax theme */}
      <div className="my-5 font-mono text-[14px] sm:text-[15px] leading-[28px] select-text flex gap-4 flex-1 overflow-x-auto min-h-[260px] items-start pt-1">
        {/* Line numbers in high-contrast slate */}
        <div
          className="flex flex-col text-right text-slate-600 dark:text-slate-400 select-none font-mono pr-3 border-r border-slate-300/60 dark:border-white/10 shrink-0 font-medium"
          aria-hidden="true"
        >
          {CODE_LINES.map((line) => (
            <span key={line.num} className="leading-[28px]">
              {line.num}
            </span>
          ))}
        </div>

        {/* Staggered animated code lines */}
        <div className="font-mono leading-[28px] whitespace-pre flex-1">
          {CODE_LINES.map((line, idx) => (
            <motion.div
              key={line.num}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.2,
                delay: shouldReduceMotion ? 0 : idx * 0.03,
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
