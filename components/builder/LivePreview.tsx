import { RenderNode } from "@/registry";

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
        <div className="text-[#FFBD2E]/80 text-sm flex flex-col gap-4 items-center justify-center h-full font-mono">
          <span className="text-4xl opacity-50">⚠️</span>
          Syntax Error in JSON Config. Fix commas/quotes to compile.
        </div>
      ) : (
        <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-32">
          {config?.pages?.[0]?.components?.map((comp: any, i: number) => (
             <RenderNode key={i} config={comp} />
          )) || (
             <div className="flex flex-col items-center justify-center text-text-muted py-24 border border-dashed border-border rounded-lg bg-surface/10">
               <span className="text-xl mb-2 opacity-50">📭</span>
               <span>No components defined on this page yet</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
