import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <div className="w-full text-center px-4 sm:px-6 relative z-10 flex flex-col items-center shrink-0">
      <div className="relative flex flex-col items-center max-w-[620px] xl:max-w-none mx-auto">
        {/* Tight legibility scrim behind headline and subtext only (~1.2x text block) */}
        <div
          aria-hidden="true"
          data-testid="hero-legibility-scrim"
          className="pointer-events-none absolute -inset-x-14 -inset-y-8 -z-10 rounded-full blur-2xl dark:opacity-100 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 85% 80% at 50% 50%, var(--canvas) 75%, transparent 100%)",
          }}
        />
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] xl:text-[56px] font-bold tracking-[-0.035em] leading-[1.08] text-foreground mb-4 whitespace-normal xl:whitespace-nowrap">
          <span>Live Config-</span>
          <span className="headline-gradient">driven Apps</span>
        </h1>

        <p className="text-[16px] sm:text-[17px] text-text-secondary leading-[1.5] max-w-[54ch] mx-auto mb-6 font-normal">
          Write or prompt a JSON config. AppForge validates every node, renders
          typed components, and syncs tables to Postgres.
        </p>
      </div>

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
