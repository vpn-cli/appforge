import { DemoCodeCard } from "./DemoCodeCard";
import { DemoPreviewCard } from "./DemoPreviewCard";

export function DemoRow() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="min-w-0">
          <DemoCodeCard />
        </div>
        <div className="min-w-0">
          <DemoPreviewCard />
        </div>
      </div>
    </div>
  );
}
