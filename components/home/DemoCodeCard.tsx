"use client";

import { useState } from "react";
import { FileCode, Copy, Check, Maximize2 } from "lucide-react";

const CODE_JSON = `{
  "app": "ops_dashboard",
  "pages": [{
    "components": [
      { "type": "Metric", "title": "Active Workflows" },
      { "type": "DataTable", "entity": "workflows" }
    ]
  }]
}`;

export function DemoCodeCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CODE_JSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="bg-white/80 dark:bg-[#12131F]/80 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl p-5 shadow-[0_20px_48px_-12px_rgba(30,27,75,0.08)] flex flex-col justify-between transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          {/* Three Window Controls */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
          </div>

          {/* File Label: Chevron removed per prompt */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 select-none ml-1">
            <FileCode className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>app.config.json</span>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer outline-none active:scale-95"
          aria-label="Copy JSON"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Inner Dark Editor Panel containing Code AND Bottom Bar */}
      <div className="mt-4 rounded-xl bg-[#14141E] border border-white/10 overflow-hidden shadow-inner flex flex-col justify-between flex-1">
        {/* Editor Code Area: 14px text, line-height 24px, min-height 300px, no clipping */}
        <div className="p-4 sm:p-5 font-mono text-[14px] leading-[24px] text-slate-300 select-text flex gap-4 min-h-[300px] flex-1 overflow-x-auto">
          {/* Line Numbers */}
          <div className="flex flex-col text-right text-slate-600 select-none font-mono pr-3 border-r border-white/5 shrink-0">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <span key={num} className="leading-[24px]">
                {num}
              </span>
            ))}
          </div>

          {/* Syntax Highlighted Code: Full lines cleanly visible */}
          <div className="font-mono leading-[24px] whitespace-pre">
            <div><span className="text-slate-400">{"{"}</span></div>
            <div>{"  "}<span className="text-[#60A5FA]">&quot;app&quot;</span><span className="text-slate-400">: </span><span className="text-[#FB923C]">&quot;ops_dashboard&quot;</span><span className="text-slate-400">,</span></div>
            <div>{"  "}<span className="text-[#60A5FA]">&quot;pages&quot;</span><span className="text-slate-400">: [{"{"}</span></div>
            <div>{"    "}<span className="text-[#60A5FA]">&quot;components&quot;</span><span className="text-slate-400">: [</span></div>
            <div>{"      "}<span className="text-slate-400">{"{ "}</span><span className="text-[#60A5FA]">&quot;type&quot;</span><span className="text-slate-400">: </span><span className="text-[#4ADE80]">&quot;Metric&quot;</span><span className="text-slate-400">, </span><span className="text-[#60A5FA]">&quot;title&quot;</span><span className="text-slate-400">: </span><span className="text-[#FB923C]">&quot;Active Workflows&quot;</span><span className="text-slate-400">{" },"}</span></div>
            <div>{"      "}<span className="text-slate-400">{"{ "}</span><span className="text-[#60A5FA]">&quot;type&quot;</span><span className="text-slate-400">: </span><span className="text-[#4ADE80]">&quot;DataTable&quot;</span><span className="text-slate-400">, </span><span className="text-[#60A5FA]">&quot;entity&quot;</span><span className="text-slate-400">: </span><span className="text-[#FB923C]">&quot;workflows&quot;</span><span className="text-slate-400">{" }"}</span></div>
            <div>{"    "}<span className="text-slate-400">]</span></div>
            <div>{"  "}<span className="text-slate-400">{"}]"}</span></div>
            <div><span className="text-slate-400">{"}"}</span></div>
          </div>
        </div>

        {/* Bottom Bar inside dark editor panel with hairline border */}
        <div className="h-8 px-4 bg-[#111119] border-t border-white/5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
            <span className="text-xs font-mono text-emerald-400 font-medium">Valid JSON</span>
          </div>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            aria-label="Expand editor"
          >
            <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
