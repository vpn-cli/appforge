import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type ValidationPanelProps = {
  errors: string[];
  warnings: string[];
  isGenerating?: boolean;
};

export function ValidationPanel({ errors, warnings, isGenerating }: ValidationPanelProps) {
  return (
    <div className="w-full h-full bg-muted flex flex-col border-t border-border overflow-hidden">
      <div className="h-9 border-b border-border flex items-center px-4 justify-between bg-card shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Validation Log</span>
        {!isGenerating && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-error-text">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.length}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-warning-text">
              <AlertCircle className="w-3.5 h-3.5" />
              {warnings.length}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5" data-lenis-prevent aria-live="polite">
        {isGenerating ? (
          <div className="flex items-center text-brand text-xs font-medium tracking-wide gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI actively rendering. Validation suspended...
          </div>
        ) : (
          <>
            {errors.length === 0 && warnings.length === 0 && (
              <div className="flex items-center text-success-text text-xs font-medium tracking-wide gap-2.5">
                <CheckCircle2 className="w-4 h-4" />
                0 issues. Config is structurally perfect.
              </div>
            )}
            {errors.map((err, i) => (
              <div key={`err-${i}`} className="text-error-text text-xs font-mono bg-error-light p-2.5 rounded-md border border-error-border leading-relaxed break-all">
                <span className="font-bold mr-1.5 uppercase opacity-70">[ERR]</span> {err}
              </div>
            ))}
            {warnings.map((warn, i) => (
              <div key={`warn-${i}`} className="text-warning-text text-xs font-mono bg-warning-light p-2.5 rounded-md border border-warning-border leading-relaxed break-all">
                <span className="font-bold mr-1.5 uppercase opacity-70">[WARN]</span> {warn}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

