import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <div className="w-full text-center px-4 sm:px-6 relative z-10 flex flex-col items-center shrink-0">
      <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold tracking-[-0.035em] leading-[1.08] text-foreground max-w-4xl mx-auto mb-4">
        <span>Live Config-</span>
        <span className="headline-gradient">driven Apps</span>
      </h1>

      <p className="text-[16px] sm:text-[17px] text-text-secondary leading-[1.5] max-w-[60ch] mx-auto mb-6 font-normal">
        Write or prompt a JSON config. AppForge validates every node, renders
        typed components, and syncs tables to Postgres.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <Button
          render={<Link href="/builder/demo" prefetch={false} />}
          variant="primary"
          size="lg"
          showArrow
        >
          <span>Start building</span>
        </Button>

        <Button
          render={<Link href="/templates" prefetch={false} />}
          variant="secondary"
          size="lg"
        >
          <span>View templates</span>
        </Button>
      </div>
    </div>
  );
}
