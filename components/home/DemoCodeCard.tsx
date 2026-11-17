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

const CODE_LINES: CodeLine[] = [
  {
    num: 1,
    parts: [{ text: "{", className: "text-slate-500 dark:text-slate-400" }],
  },
  {
    num: 2,
    parts: [
      { text: '  "app"', className: "text-indigo-600 dark:text-indigo-400 font-medium" },
      { text: ": ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"ops_dashboard"', className: "text-amber-700 dark:text-amber-300" },
      { text: ",", className: "text-slate-500 dark:text-slate-400" },
    ],
  },
  {
    num: 3,
    parts: [
      { text: '  "pages"', className: "text-indigo-600 dark:text-indigo-400 font-medium" },
      { text: ": [{", className: "text-slate-500 dark:text-slate-400" },
    ],
  },
  {
    num: 4,
    parts: [
      { text: '    "components"', className: "text-indigo-600 dark:text-indigo-400 font-medium" },
      { text: ": [", className: "text-slate-500 dark:text-slate-400" },
    ],
  },
  {
    num: 5,
    parts: [
      { text: "      { ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"type"', className: "text-indigo-600 dark:text-indigo-400 font-medium" },
      { text: ": ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"Metric"', className: "text-amber-700 dark:text-amber-300" },
      { text: ", ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"title"', className: "text-indigo-600 dark:text-indigo-400 font-medium" },
      { text: ": ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"Active Workflows"', className: "text-amber-700 dark:text-amber-300" },
      { text: " },", className: "text-slate-500 dark:text-slate-400" },
    ],
  },
  {
    num: 6,
    parts: [
      { text: "      { ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"type"', className: "text-indigo-600 dark:text-indigo-400 font-medium" },
      { text: ": ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"DataTable"', className: "text-amber-700 dark:text-amber-300" },
      { text: ", ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"entity"', className: "text-indigo-600 dark:text-indigo-400 font-medium" },
      { text: ": ", className: "text-slate-500 dark:text-slate-400" },
      { text: '"workflows"', className: "text-amber-700 dark:text-amber-300" },
      { text: " }", className: "text-slate-500 dark:text-slate-400" },
    ],
  },
  {
    num: 7,
    parts: [{ text: "    ]", className: "text-slate-500 dark:text-slate-400" }],
  },
  {
    num: 8,
    parts: [{ text: "  }]", className: "text-slate-500 dark:text-slate-400" }],
  },
  {
    num: 9,
    parts: [{ text: "}", className: "text-slate-500 dark:text-slate-400" }],
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
    <div className="bg-white/75 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[20px] p-5 sm:p-6 shadow-[0_2px_6px_-1px_rgba(15,23,42,0.04),0_20px_48px_-12px_rgba(99,102,241,0.08)] flex flex-col justify-between h-full transition-all">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]/90" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]/90" />
            <span className="w-3 h-3 rounded-full bg-[#10B981]/90" />
          </div>

          {/* File tab: app.config.json with a chevron */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 select-none ml-1">
            <FileCode className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
            <span>app.config.json</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" strokeWidth={2} />
          </div>
        </div>

        {/* Copy button (shows "Copied" for 1.5s) */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer outline-none active:scale-95"
          aria-label="Copy JSON code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Editor Body: Single frosted surface, light syntax theme, no dark nested box */}
      <div className="my-4 font-mono text-[13px] sm:text-[14px] leading-[26px] select-text flex gap-4 flex-1 overflow-x-auto min-h-[250px] items-start pt-1">
        {/* Line numbers in muted slate */}
        <div
          className="flex flex-col text-right text-slate-400 dark:text-slate-500 select-none font-mono pr-3 border-r border-slate-200/60 dark:border-white/10 shrink-0"
          aria-hidden="true"
        >
          {CODE_LINES.map((line) => (
            <span key={line.num} className="leading-[26px]">
              {line.num}
            </span>
          ))}
        </div>

        {/* Staggered animated code lines */}
        <div className="font-mono leading-[26px] whitespace-pre flex-1">
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

      {/* Valid JSON status: quiet footer line with a small green dot */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">Valid JSON</span>
        </div>
        <span className="font-mono text-slate-400 text-[11px]">UTF-8</span>
      </div>
    </div>
  );
}
