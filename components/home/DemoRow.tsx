"use client";

import { DemoCodeCard } from "./DemoCodeCard";
import { DemoPreviewCard } from "./DemoPreviewCard";

export function DemoRow() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="min-w-0 flex flex-col h-full">
          <DemoCodeCard
            variantDisplay='"gradient"'
            validationStatus="valid"
            activeLineHighlighted={false}
            showCursor={false}
          />
        </div>
        <div className="min-w-0 flex flex-col h-full">
          <DemoPreviewCard variant="gradient" />
        </div>
      </div>
    </div>
  );
}
