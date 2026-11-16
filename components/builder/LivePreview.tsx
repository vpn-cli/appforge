import { RenderNode } from "@/registry";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

function PreviewSkeleton() {
  return (
    <motion.div 
      key="skeleton"
      initial={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto flex flex-col gap-8 pb-32 w-full pt-8"
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-3/4 max-w-[400px] rounded-xl bg-card" />
        <Skeleton className="h-6 w-1/2 max-w-[600px] rounded-lg bg-card/60" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[220px] rounded-2xl w-full bg-card shadow-sm" />
        <Skeleton className="h-[220px] rounded-2xl w-full bg-card shadow-sm" />
        <Skeleton className="h-[220px] rounded-2xl w-full bg-card shadow-sm" />
      </div>
      <Skeleton className="h-[350px] rounded-3xl w-full mt-4 bg-card" />
    </motion.div>
  );
}

function extractJsonParsePosition(err: unknown, raw: string): { line?: number; column?: number } {
  if (!(err instanceof Error)) return {};
  const msg = err.message;
  const lineColMatch = msg.match(/line\s+(\d+).*?column\s+(\d+)/i);
  if (lineColMatch) {
    return { line: parseInt(lineColMatch[1], 10), column: parseInt(lineColMatch[2], 10) };
  }
  const posMatch = msg.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    if (!isNaN(pos) && pos >= 0 && pos <= raw.length) {
      const lines = raw.slice(0, pos).split("\n");
      return { line: lines.length, column: lines[lines.length - 1].length + 1 };
    }
  }
  return {};
}

export function LivePreview({ configStr }: { configStr: string }) {
  let config;
  let parseError = false;
  let errorPosition: { line?: number; column?: number } = {};
  const isStreaming = configStr.includes('"<<<REPLACE>>>"');

  try {
    if (!isStreaming) {
      config = JSON.parse(configStr);
    }
  } catch (err: unknown) {
    parseError = true;
    errorPosition = extractJsonParsePosition(err, configStr);
  }

  return (
    <div className="w-full h-[calc(100vh-44px)] bg-background overflow-y-auto p-4 md:p-8" data-lenis-prevent>
      <AnimatePresence mode="wait">
        {isStreaming ? (
          <PreviewSkeleton />
        ) : parseError ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-warning-text text-sm flex flex-col gap-2 items-center justify-center h-full font-mono p-6 bg-warning-light/30 border border-warning-border/50 rounded-lg max-w-md mx-auto"
          >
            <span className="text-2xl opacity-80">⚠️</span>
            <span className="text-center font-semibold">
              Malformed configuration JSON
              {errorPosition.line ? ` at line ${errorPosition.line}, column ${errorPosition.column}` : ""}
            </span>
            <span className="text-center text-xs text-muted-foreground font-sans">
              Inspect quotes, commas, and entity structures.
            </span>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto flex flex-col gap-8 pb-32"
          >
            {config?.pages?.[0]?.components?.map((comp: Record<string, unknown>, i: number) => (
               <RenderNode key={i} config={comp} />
            )) || (
               <div className="flex flex-col items-center justify-center text-muted-foreground py-24 border border-dashed border-border rounded-xl bg-card/10">
                 <span className="text-xl mb-2 opacity-50">📭</span>
                 <span>No components defined on this page yet</span>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

