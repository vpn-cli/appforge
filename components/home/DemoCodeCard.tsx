"use client";

import { useState } from "react";
import { FileCode, Copy, Check, Maximize2 } from "lucide-react";

const CODE_JSON = `{
  "app": "ops_dashboard",
  "pages": [{
    "components": [
      { "type": "Statistic", "title": "Active Workflows" },
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
    <div className="bg-white/80 dark:bg-[#12131F]/80 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-[0_20px_48px_-12px_rgba(30,27,75,0.08)] flex flex-col justify-between transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          {/* Three Window Controls (muted red/amber/green) */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/90" />
          </div>

          {/* File Label */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
            <FileCode className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>app.config.json</span>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer outline-none active:scale-95"
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

      {/* Inner Dark Editor Panel */}
      <div className="my-3.5 rounded-xl bg-[#14141E] border border-white/5 p-4 sm:p-5 font-mono text-[13px] leading-relaxed text-slate-300 overflow-x-auto shadow-inner select-text">
        <div className="flex gap-4">
          {/* Line Numbers */}
          <div className="flex flex-col text-right text-slate-600 select-none font-mono pr-2 border-r border-white/5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <span key={num} className="leading-6">
                {num}
              </span>
            ))}
          </div>

          {/* Syntax Highlighted Code */}
          <pre className="font-mono leading-6 overflow-visible">
            <code>
              <span className="text-slate-400">{"{"}</span>
              {"\n  "}
              <span className="text-[#60A5FA]">&quot;app&quot;</span>
              <span className="text-slate-400">: </span>
              <span className="text-[#FB923C]">&quot;ops_dashboard&quot;</span>
              <span className="text-slate-400">,</span>
              {"\n  "}
              <span className="text-[#60A5FA]">&quot;pages&quot;</span>
              <span className="text-slate-400">: [{"{"}</span>
              {"\n    "}
              <span className="text-[#60A5FA]">&quot;components&quot;</span>
              <span className="text-slate-400">: [</span>
              {"\n      "}
              <span className="text-slate-400">{"{ "}</span>
              <span className="text-[#60A5FA]">&quot;type&quot;</span>
              <span className="text-slate-400">: </span>
              <span className="text-[#4ADE80]">&quot;Statistic&quot;</span>
              <span className="text-slate-400">, </span>
              <span className="text-[#60A5FA]">&quot;title&quot;</span>
              <span className="text-slate-400">: </span>
              <span className="text-[#FB923C]">&quot;Active Workflows&quot;</span>
              <span className="text-slate-400">{" },"}</span>
              {"\n      "}
              <span className="text-slate-400">{"{ "}</span>
              <span className="text-[#60A5FA]">&quot;type&quot;</span>
              <span className="text-slate-400">: </span>
              <span className="text-[#4ADE80]">&quot;DataTable&quot;</span>
              <span className="text-slate-400">, </span>
              <span className="text-[#60A5FA]">&quot;entity&quot;</span>
              <span className="text-slate-400">: </span>
              <span className="text-[#FB923C]">&quot;workflows&quot;</span>
              <span className="text-slate-400">{" }"}</span>
              {"\n    "}
              <span className="text-slate-400">]</span>
              {"\n  "}
              <span className="text-slate-400">{"}]"}</span>
              {"\n"}
              <span className="text-slate-400">{"}"}</span>
            </code>
          </pre>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Valid JSON</span>
        </div>
        <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer" strokeWidth={1.75} />
      </div>
    </div>
  );
}
