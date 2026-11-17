"use client";

import { DemoCodeCard } from "./DemoCodeCard";
import { DemoPreviewCard } from "./DemoPreviewCard";

export function DemoRow() {
  return (
    <section className="w-full max-w-[1200px] mx-auto pb-12 sm:pb-16 relative z-10 px-4 sm:px-6">
      {/* 55/45 two-column grid with equal heights, stacks below 1024px with code first */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.22fr_1fr] gap-6 items-stretch">
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
