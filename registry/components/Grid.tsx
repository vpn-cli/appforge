import { RenderNode } from "../index";

export interface GridProps {
  columns?: number | string;
  gap?: number | string;
  items?: unknown[];
  className?: string;
}

export function resolveGridColsClass(
  configuredColumns: number | string,
  itemCount: number
): string {
  const colNum = Number(configuredColumns);

  // 1. Exactly 1 item or 1 column: always single column
  if (colNum === 1 || itemCount === 1) {
    return "grid-cols-1";
  }

  // 2. Exactly 4 items (or configured 4 with 4 items):
  // 4x1 when there's room (>=860px), else 2x2 (>=420px), else 1x1. NEVER 3+1!
  if (itemCount === 4 || (colNum === 4 && itemCount === 4)) {
    return "grid-cols-1 @[420px]:grid-cols-2 @[860px]:grid-cols-4";
  }

  // 3. Exactly 2 items (or configured 2 with <=2 items): 2x1 when room, else 1x1
  if (itemCount === 2 || (colNum === 2 && itemCount <= 2)) {
    return "grid-cols-1 @[420px]:grid-cols-2";
  }

  // 4. Exactly 3 items (or configured 3 with <=3 items): 3x1 when room, else 1x1
  if (itemCount === 3 || (colNum === 3 && itemCount <= 3)) {
    return "grid-cols-1 @[600px]:grid-cols-3";
  }

  // 5. Exactly 5 items (or configured 5 columns):
  // 5x1 on wide (>=960px), 3x2 on medium (>=640px, giving a balanced 3+2 split instead of a 4+1 orphan card),
  // 2x3 on compact (>=420px), else 1x5
  if (itemCount === 5 || colNum === 5) {
    return "grid-cols-1 @[420px]:grid-cols-2 @[640px]:grid-cols-3 @[960px]:grid-cols-5";
  }

  // 6. Exactly 6 items: 6x1 -> 3x2 -> 2x3 -> 1x6 (all divide cleanly)
  if (itemCount === 6) {
    return "grid-cols-1 @[420px]:grid-cols-2 @[640px]:grid-cols-3 @[960px]:grid-cols-6";
  }

  // 7. Exactly 7 items (or configured 7 columns):
  // 7x1 when ultra-wide and configured 7 (>=1100px), else 4 columns on wide (>=860px, yielding a balanced 4+3 split with no lonely orphan card),
  // 3 on medium (>=640px), 2 on compact (>=420px), else 1 column
  if (itemCount === 7 || colNum === 7) {
    if (colNum === 7) {
      return "grid-cols-1 @[420px]:grid-cols-2 @[640px]:grid-cols-3 @[860px]:grid-cols-4 @[1100px]:grid-cols-7";
    }
    return "grid-cols-1 @[420px]:grid-cols-2 @[640px]:grid-cols-3 @[860px]:grid-cols-4";
  }

  // 8. Configured 4 columns with even item counts (e.g. 8): balance rows by 2 or 4
  if (colNum === 4) {
    return "grid-cols-1 @[420px]:grid-cols-2 @[860px]:grid-cols-4";
  }

  // 9. Configured 2 or 3 columns with arbitrary items
  if (colNum === 2) {
    return "grid-cols-1 @[420px]:grid-cols-2";
  }
  if (colNum === 3) {
    return "grid-cols-1 @[600px]:grid-cols-3";
  }

  if (colNum >= 8) {
    return "grid-cols-1 @[420px]:grid-cols-2 @[720px]:grid-cols-4 @[1200px]:grid-cols-8";
  }

  return "grid-cols-1 @[420px]:grid-cols-2 @[860px]:grid-cols-4";
}

export function Grid({
  columns = 2,
  gap = 4,
  items = [],
  className = "",
}: GridProps) {
  const gapMap: Record<string, string> = {
    "1": "gap-1",
    "2": "gap-2",
    "3": "gap-3",
    "4": "gap-4",
    "6": "gap-6",
    "8": "gap-8",
  };

  const safeCols = resolveGridColsClass(columns, items.length);
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
