import { RenderNode } from "../index";

export interface GridProps {
  columns?: number | string;
  gap?: number | string;
  items?: unknown[];
  className?: string;
}

export function Grid({
  columns = 2,
  gap = 4,
  items = [],
  className = "",
}: GridProps) {
  // Safe Tailwind static class mapping
  const colMap: Record<string, string> = {
    "1": "grid-cols-1",
    "2": "grid-cols-1 md:grid-cols-2",
    "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  const gapMap: Record<string, string> = {
    "2": "gap-2",
    "3": "gap-3",
    "4": "gap-4",
    "6": "gap-6",
    "8": "gap-8",
  };

  const safeCols = colMap[String(columns)] || colMap["2"];
  const safeGap = gapMap[String(gap)] || gapMap["4"];

  if (!items || items.length === 0) {
    return (
      <div className="w-full py-8 border border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-card/10">
        Empty grid layout
      </div>
    );
  }

  return (
    <div className={`grid ${safeCols} ${safeGap} items-stretch w-full ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col h-full w-full">
          <RenderNode config={item} />
        </div>
      ))}
    </div>
  );
}
