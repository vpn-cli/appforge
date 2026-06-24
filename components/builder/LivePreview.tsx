export function LivePreview({ configStr }: { configStr: string }) {
  let config;
  let parseError = false;

  try {
    config = JSON.parse(configStr);
  } catch (e) {
    parseError = true;
  }

  return (
    <div className="w-full h-[calc(100vh-56px)] bg-background overflow-y-auto p-4 md:p-8" data-lenis-prevent>
      {parseError ? (
        <div className="text-text-muted text-sm flex items-center justify-center h-full font-mono">
          Waiting for valid JSON...
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 border border-dashed border-border rounded-xl bg-surface/30 shadow-inner">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{config?.app || "Untitled App"}</h1>
            <p className="text-text-muted mt-2 text-sm font-mono opacity-60">Phase 3 Structural Layout Simulation...</p>
          </div>
          
          <div className="grid gap-4">
            {config?.pages?.[0]?.components?.map((comp: any, i: number) => (
              <div key={i} className="p-4 border border-border bg-surface rounded-lg shadow-sm hover:shadow-md transition-shadow">
                 <div className="text-xs font-bold text-brand uppercase tracking-wider mb-2 flex items-center justify-between">
                   <span>{comp.type || "Unknown Component"}</span>
                 </div>
                 <pre className="text-[11px] text-text-muted overflow-x-auto bg-surface-secondary p-3 rounded border border-white/5 font-mono shadow-inner">
                   {JSON.stringify(comp, null, 2)}
                 </pre>
              </div>
            )) || (
              <div className="flex flex-col items-center justify-center text-text-muted py-24 border border-dashed border-border rounded-lg bg-surface/10">
                <span className="text-xl mb-2 opacity-50">📭</span>
                <span>No components defined yet</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
