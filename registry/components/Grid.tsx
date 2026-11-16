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
  // Container-based column mapping adapting dynamically up to configured columns
  const colMap: Record<string, string> = {
    "1": "grid-cols-1",
    "2": "grid-cols-1 @[420px]:grid-cols-2",
    "3": "grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-3",
    "4": "grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-3 @[960px]:grid-cols-4",
    "5": "grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-3 @[960px]:grid-cols-5",
    "6": "grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-3 @[960px]:grid-cols-6",
    "8": "grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-4 @[960px]:grid-cols-6 @[1200px]:grid-cols-8",
  };

  const gapMap: Record<string, string> = {
    "1": "gap-1",
    "2": "gap-2",
    "3": "gap-3",
    "4": "gap-4",
    "6": "gap-6",
    "8": "gap-8",
  };

  const safeCols = colMap[String(columns)] || (
    Number(columns) > 4
      ? "grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-4"
      : "grid-cols-1 @[420px]:grid-cols-2"
  );
  const safeGap = gapMap[String(gap)] || gapMap["4"];

  if (!items || items.length === 0) {
    return (
      <div className="w-full py-8 border border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-card/10">
        Empty grid layout
      </div>
    );
  }

  return (
    <div className={`@container w-full min-w-0 ${className}`}>
      <div className={`grid ${safeCols} ${safeGap} items-stretch w-full min-w-0`}>
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col h-full w-full min-w-0">
            <RenderNode config={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
