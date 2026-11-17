"use client";

import { DemoCodeCard } from "./DemoCodeCard";
import { DemoPreviewCard } from "./DemoPreviewCard";

export function DemoRow() {
  return (
    <section className="w-full max-w-[1200px] mx-auto pb-8 relative z-10 px-4 sm:px-6">
      {/* Equal width (1fr 1fr), equal height, max about 380px panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="h-full">
          <DemoCodeCard />
        </div>
        <div className="h-full">
          <DemoPreviewCard />
        </div>
      </div>
    </section>
  );
}
