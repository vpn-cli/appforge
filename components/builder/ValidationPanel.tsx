import { AlertCircle, CheckCircle2 } from "lucide-react";

type ValidationPanelProps = {
  errors: string[];
  warnings: string[];
};

export function ValidationPanel({ errors, warnings }: ValidationPanelProps) {
  return (
    <div className="w-full h-full bg-surface-secondary flex flex-col border-t border-border overflow-hidden">
      <div className="h-9 border-b border-border flex items-center px-4 justify-between bg-surface shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Validation Log</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF5F56]">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.length}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFBD2E]">
            <AlertCircle className="w-3.5 h-3.5" />
            {warnings.length}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5" data-lenis-prevent>
        {errors.length === 0 && warnings.length === 0 && (
          <div className="flex items-center text-[#27C93F] text-xs font-medium tracking-wide gap-2.5">
            <CheckCircle2 className="w-4 h-4" />
            0 issues. Config is structurally perfect.
          </div>
        )}
        {errors.map((err, i) => (
          <div key={`err-${i}`} className="text-[#FF5F56] text-[11px] font-mono bg-[#FF5F56]/10 p-2.5 rounded border border-[#FF5F56]/20 leading-relaxed break-all">
            <span className="font-bold mr-1.5 uppercase opacity-70">[ERR]</span> {err}
          </div>
        ))}
        {warnings.map((warn, i) => (
          <div key={`warn-${i}`} className="text-[#FFBD2E] text-[11px] font-mono bg-[#FFBD2E]/10 p-2.5 rounded border border-[#FFBD2E]/20 leading-relaxed break-all">
            <span className="font-bold mr-1.5 uppercase opacity-70">[WARN]</span> {warn}
          </div>
        ))}
      </div>
    </div>
  );
}
