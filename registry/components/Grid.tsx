import { RenderNode } from "../index";

export function Grid({ columns = 2, gap = 6, items = [] }: { columns?: number | string, gap?: number | string, items?: any[] }) {
  // A mapping to safely compile Tailwind grid classes without runtime arbitrary values breaking
  const colMap: Record<string, string> = {
    "1": "md:grid-cols-1",
    "2": "md:grid-cols-2",
    "3": "lg:grid-cols-3 md:grid-cols-2",
    "4": "xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2",
  };
  
  const gapMap: Record<string, string> = {
    "2": "gap-2",
    "4": "gap-4",
    "6": "gap-6",
    "8": "gap-8",
  };

  const safeCols = colMap[String(columns)] || colMap["2"];
  const safeGap = gapMap[String(gap)] || gapMap["6"];

  return (
    <div className={`grid grid-cols-1 ${safeCols} ${safeGap} w-full`}>
       {items.map((item, idx) => (
         <RenderNode key={idx} config={item} />
       ))}
    </div>
  );
}
